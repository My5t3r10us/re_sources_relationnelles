import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { AddressInfo } from "node:net";

type NextRouteHandler = (req: Request, ctx: { params: Promise<Record<string, string | string[]>> }) => Promise<Response> | Response;

export interface RouteRegistration {
  /** Path template like "/api/v1/resources/[id]" or "/api/v1/resources" */
  path: string;
  /** Imported route handlers (GET/POST/PATCH/DELETE/PUT) */
  handlers: Partial<Record<"GET" | "POST" | "PATCH" | "PUT" | "DELETE", NextRouteHandler>>;
}

interface CompiledRoute {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  regex: RegExp;
  paramNames: string[];
  handler: NextRouteHandler;
}

function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const segments = path.split("/").filter(Boolean).map((seg) => {
    const m = seg.match(/^\[(\.\.\.)?(.+)\]$/);
    if (m) {
      paramNames.push(m[2]);
      if (m[1]) return "(.+)"; // catch-all
      return "([^/]+)";
    }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  const regex = new RegExp("^/" + segments.join("/") + "/?$");
  return { regex, paramNames };
}

export function buildHandlerServer(routes: RouteRegistration[]): Server {
  const compiled: CompiledRoute[] = [];
  for (const r of routes) {
    const { regex, paramNames } = compilePath(r.path);
    for (const [method, handler] of Object.entries(r.handlers)) {
      if (!handler) continue;
      compiled.push({
        method: method as CompiledRoute["method"],
        regex,
        paramNames,
        handler,
      });
    }
  }

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const route = compiled.find(
        (r) => r.method === req.method && r.regex.test(url.pathname),
      );
      if (!route) {
        res.statusCode = 404;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ data: null, error: { code: "NOT_FOUND", message: "No route" } }));
        return;
      }

      const match = route.regex.exec(url.pathname)!;
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) for (const vv of v) headers.append(k, vv);
        else if (v !== undefined) headers.set(k, v);
      }

      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers,
        body: body && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
      });

      const response = await route.handler(request, { params: Promise.resolve(params) });
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      const buf = Buffer.from(await response.arrayBuffer());
      res.end(buf);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ data: null, error: { code: "TEST_HARNESS_ERROR", message: String(err) } }));
    }
  });
}

export async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as AddressInfo;
  return `http://127.0.0.1:${addr.port}`;
}

export async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
}
