import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

let _s3: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION ?? "auto",
      endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? "https://t3.storage.dev",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
      forcePathStyle: true,
    });
  }
  return _s3;
}

export const S3_BUCKET = process.env.AWS_BUCKET ?? "resources";

export function getPublicUrl(objectKey: string): string {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? "https://t3.storage.dev";
  return `${endpoint}/${S3_BUCKET}/${objectKey}`;
}

export async function uploadObject(
  objectKey: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject(objectKey: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
    })
  );
}
