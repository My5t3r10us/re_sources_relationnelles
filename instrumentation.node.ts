import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import pkg from "@/package.json";
import { telemetryConfig, telemetryHeaders } from "@/lib/telemetry";

/**
 * Démarrage du SDK Node d'OpenTelemetry, exporté vers OneUptime en OTLP/HTTP.
 *
 * Ce module n'est importé que depuis `instrumentation.ts`, et uniquement quand
 * `NEXT_RUNTIME` vaut `nodejs` : `NodeSDK` n'est pas compatible avec le runtime
 * edge et son import y ferait échouer la compilation.
 */
const config = telemetryConfig();

if (config) {
  const headers = telemetryHeaders(config);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: pkg.version,
      // Distingue les traces de préproduction de celles de production, les deux
      // environnements pointant vers la même instance OneUptime.
      "deployment.environment": process.env.NODE_ENV ?? "development",
    }),
    // Traitement par lots : un export synchrone par span ajouterait un aller-
    // retour réseau sur le chemin de chaque requête.
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${config.endpoint}/v1/traces`, headers }),
      ),
    ],
    logRecordProcessors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({ url: `${config.endpoint}/v1/logs`, headers }),
      }),
    ],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Le système de fichiers génère un bruit considérable pendant le rendu
        // Next.js, sans valeur de diagnostic.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Sans vidage explicite, les lots en attente sont perdus quand Dokploy
  // arrête le conteneur — c'est-à-dire précisément lors d'un incident.
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void sdk.shutdown().catch(() => {});
    });
  }
}
