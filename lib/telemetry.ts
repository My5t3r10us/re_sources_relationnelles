import { SeverityNumber, logs } from "@opentelemetry/api-logs";
import { SpanStatusCode, trace } from "@opentelemetry/api";

/**
 * Pont applicatif vers OneUptime, via OpenTelemetry.
 *
 * Le choix d'OTLP plutôt que d'un paquet propre à l'éditeur est délibéré :
 * l'instance OneUptime est auto-hébergée, et un exportateur standard permet de
 * la remplacer par n'importe quel collecteur sans toucher au code applicatif.
 *
 * Tout est neutralisé quand `ONEUPTIME_OTLP_ENDPOINT` et `ONEUPTIME_OTLP_TOKEN`
 * ne sont pas tous les deux renseignés : le développement local, la CI et les
 * tests se comportent donc exactement comme avant l'ajout de la supervision.
 */

export const TELEMETRY_SERVICE_NAME_DEFAULT = "resources-relationnelles";

export interface TelemetryConfig {
  endpoint: string;
  token: string;
  serviceName: string;
}

/**
 * Lit la configuration à chaque appel plutôt qu'au chargement du module : les
 * variables sont fournies par Dokploy à l'exécution, et un cache figé au
 * premier import rendrait les tests dépendants de leur ordre d'exécution.
 */
export function telemetryConfig(env: EnvLike = process.env): TelemetryConfig | null {
  const endpoint = env.ONEUPTIME_OTLP_ENDPOINT?.trim();
  const token = env.ONEUPTIME_OTLP_TOKEN?.trim();

  if (!endpoint || !token) return null;

  return {
    endpoint: endpoint.replace(/\/+$/, ""),
    token,
    serviceName: env.ONEUPTIME_SERVICE_NAME?.trim() || TELEMETRY_SERVICE_NAME_DEFAULT,
  };
}

export function isTelemetryEnabled(env: EnvLike = process.env): boolean {
  return telemetryConfig(env) !== null;
}

/** OneUptime authentifie l'ingestion par un en-tête dédié, pas par un Bearer. */
export function telemetryHeaders(config: TelemetryConfig): Record<string, string> {
  return { "x-oneuptime-token": config.token };
}

export interface ErrorContext {
  /** Origine de l'erreur : `route`, `render`, `boundary`… */
  source?: string;
  /** Chemin de la requête, sans paramètre de recherche. */
  path?: string;
  /** Empreinte fournie par Next.js, qui relie l'écran d'erreur aux journaux. */
  digest?: string;
  [key: string]: unknown;
}

/**
 * Aplatit le contexte en attributs scalaires : l'API OpenTelemetry n'accepte
 * pas de valeur structurée, et un objet y arriverait en `[object Object]`.
 */
function toAttributes(context: ErrorContext): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined || value === null) continue;
    attributes[`app.${key}`] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return attributes;
}

/**
 * Signale une erreur à OneUptime : exception portée par la trace courante, et
 * enregistrement de journal autonome pour les erreurs survenant hors span.
 *
 * Best-effort, sur le modèle de `lib/audit-log.ts` : la supervision ne doit
 * jamais faire échouer l'action qu'elle observe.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  const normalized = error instanceof Error ? error : new Error(String(error));

  // Le journal serveur reste la source de vérité quand la télémétrie est
  // désactivée, c'est-à-dire en développement et en CI.
  console.error(`[telemetry] ${context.source ?? "app"}`, normalized.message);

  if (!isTelemetryEnabled()) return;

  const attributes = toAttributes(context);

  try {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.recordException(normalized);
      activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: normalized.message });
      activeSpan.setAttributes(attributes);
    }

    logs.getLogger("app").emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: normalized.message,
      attributes: {
        ...attributes,
        "exception.type": normalized.name,
        "exception.stacktrace": normalized.stack ?? "",
      },
    });
  } catch (err) {
    console.error("[telemetry] échec du signalement de l'erreur", err);
  }
}
/** Vue minimale de l'environnement, pour rester injectable depuis les tests. */
export type EnvLike = Record<string, string | undefined>;
