import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TELEMETRY_SERVICE_NAME_DEFAULT,
  captureError,
  isTelemetryEnabled,
  telemetryConfig,
  telemetryHeaders,
} from "@/lib/telemetry";

describe("telemetryConfig", () => {
  it("returns null unless endpoint and token are both set", () => {
    expect(telemetryConfig({})).toBeNull();
    expect(
      telemetryConfig({ ONEUPTIME_OTLP_ENDPOINT: "https://o.example/otlp" }),
    ).toBeNull();
    expect(telemetryConfig({ ONEUPTIME_OTLP_TOKEN: "t" })).toBeNull();
  });

  it("strips the trailing slash and defaults the service name", () => {
    expect(
      telemetryConfig({
        ONEUPTIME_OTLP_ENDPOINT: "https://o.example/otlp/",
        ONEUPTIME_OTLP_TOKEN: "t",
      }),
    ).toEqual({
      endpoint: "https://o.example/otlp",
      token: "t",
      serviceName: TELEMETRY_SERVICE_NAME_DEFAULT,
    });
  });

  it("honours an explicit service name", () => {
    const config = telemetryConfig({
      ONEUPTIME_OTLP_ENDPOINT: "https://o.example/otlp",
      ONEUPTIME_OTLP_TOKEN: "t",
      ONEUPTIME_SERVICE_NAME: "preprod",
    });
    expect(config?.serviceName).toBe("preprod");
  });
});

describe("telemetryHeaders", () => {
  it("authenticates with the OneUptime ingestion header", () => {
    expect(
      telemetryHeaders({ endpoint: "https://o.example", token: "t", serviceName: "s" }),
    ).toEqual({ "x-oneuptime-token": "t" });
  });
});

describe("captureError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ONEUPTIME_OTLP_ENDPOINT;
    delete process.env.ONEUPTIME_OTLP_TOKEN;
  });

  it("is disabled when the environment is not configured", () => {
    expect(isTelemetryEnabled()).toBe(false);
    expect(() => captureError(new Error("boom"), { source: "test" })).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });

  it("does not throw on a non-Error value", () => {
    expect(() => captureError("chaîne brute")).not.toThrow();
  });

  it("stays silent-safe once configured", () => {
    process.env.ONEUPTIME_OTLP_ENDPOINT = "https://o.example/otlp";
    process.env.ONEUPTIME_OTLP_TOKEN = "t";
    expect(isTelemetryEnabled()).toBe(true);
    // Aucun fournisseur n'est enregistré dans le test : l'API OpenTelemetry
    // retombe sur ses implémentations neutres, et l'appel doit rester inoffensif.
    expect(() => captureError(new Error("boom"), { source: "test", path: "/x" })).not.toThrow();
  });
});
