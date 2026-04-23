import { Client } from "minio";

let _client: Client | null = null;

export function getMinioClient(): Client {
  if (!_client) {
    _client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "",
      secretKey: process.env.MINIO_SECRET_KEY || "",
    });
  }
  return _client;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "resources";

export function getMinioPublicUrl(objectName: string): string {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const endpoint = process.env.MINIO_ENDPOINT || "localhost";
  const port = process.env.MINIO_PORT || "9000";
  return `${protocol}://${endpoint}:${port}/${MINIO_BUCKET}/${objectName}`;
}
