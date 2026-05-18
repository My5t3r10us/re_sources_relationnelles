import type { Server } from "node:http";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { buildHandlerServer, listen, close, type RouteRegistration } from "./next-handler-server";
import { resetDb } from "./db";

export interface ApiHarness {
  req: () => request.Agent;
  baseUrl: () => string;
}

export function setupApiHarness(routes: RouteRegistration[]): ApiHarness {
  let server: Server | undefined;
  let baseUrl = "";

  beforeAll(async () => {
    server = buildHandlerServer(routes);
    baseUrl = await listen(server);
  });

  afterAll(async () => {
    if (server) await close(server);
  });

  beforeEach(async () => {
    await resetDb();
  });

  return {
    req: () => request(baseUrl),
    baseUrl: () => baseUrl,
  };
}
