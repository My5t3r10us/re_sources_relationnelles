import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

export function getMinioClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_REGION ?? "auto",
      endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? "https://t3.storage.dev",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

export const MINIO_BUCKET = process.env.AWS_BUCKET ?? process.env.MINIO_BUCKET ?? "resources";

export function getMinioPublicUrl(objectName: string): string {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? "https://t3.storage.dev";
  return `${endpoint}/${MINIO_BUCKET}/${objectName}`;
}

export async function uploadToS3(
  objectName: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const client = getMinioClient();
  await client.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: objectName,
      Body: body,
      ContentType: contentType,
    })
  );
}
