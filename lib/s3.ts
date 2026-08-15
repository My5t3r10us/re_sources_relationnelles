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

const PUBLIC_URL_BASE =
  process.env.AWS_PUBLIC_URL?.replace(/\/$/, "") ??
  `https://${S3_BUCKET}.t3.tigrisfiles.io`;

export function getPublicUrl(objectKey: string): string {
  return `${PUBLIC_URL_BASE}/${objectKey}`;
}

/**
 * Extrait la clé S3 d'une URL publique.
 *
 * `ownerId` est OBLIGATOIRE : la clé doit se trouver sous le préfixe de son
 * propriétaire — c'est la convention posée à l'upload (`<userId>/<uuid>.<ext>`).
 *
 * Sans ce contrôle, `imageUrl` et `attachments[].url` étant fournis par le
 * client, il suffisait de créer une ressource pointant sur l'objet d'autrui
 * puis de la supprimer pour détruire le fichier de la victime — les clés des
 * victimes étant publiquement lisibles sur chaque ressource du catalogue.
 */
export function getObjectKeyFromUrl(url: string, ownerId: string): string | null {
  const key = extractRawKey(url);
  if (key === null) return null;
  return isKeyOwnedBy(key, ownerId) ? key : null;
}

/**
 * Extrait la clé S3 d'une URL **déjà stockée en base**, sans contrôle de
 * propriétaire.
 *
 * À n'utiliser que sur des URL relues depuis la base : toute URL entrante a
 * déjà franchi `assertOwnedObjectUrl` à l'écriture (publication et édition de
 * ressource), donc sa possession a été vérifiée au moment où elle est devenue
 * une donnée. Ne jamais l'appeler sur une URL provenant directement d'une
 * requête — ce serait rouvrir C-4.
 *
 * Nécessaire depuis l'anonymisation RGPD (`lib/rgpd.ts`) : les ressources d'un
 * compte supprimé sont réattribuées au compte « Utilisateur supprimé » alors
 * que leurs clés gardent le préfixe du propriétaire d'origine. Un
 * `getObjectKeyFromUrl(url, nouvelAuteur)` ne les reconnaîtrait plus, et une
 * suppression ultérieure laisserait les objets orphelins dans le bucket.
 */
export function getStoredObjectKey(url: string): string | null {
  const key = extractRawKey(url);
  if (key === null) return null;
  // Même durcissement que `isKeyOwnedBy`, sans la comparaison de préfixe.
  if (key.includes("..") || key.startsWith("/")) return null;
  return key;
}

function extractRawKey(url: string): string | null {
  const publicPrefix = `${PUBLIC_URL_BASE}/`;
  if (url.startsWith(publicPrefix)) return url.slice(publicPrefix.length);

  const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? "https://t3.storage.dev";
  const legacyPrefix = `${endpoint}/${S3_BUCKET}/`;
  if (url.startsWith(legacyPrefix)) return url.slice(legacyPrefix.length);

  return null;
}

function isKeyOwnedBy(key: string, ownerId: string): boolean {
  if (!ownerId) return false;
  // Rejette la traversée et les clés relatives avant la comparaison de préfixe.
  if (key.includes("..") || key.startsWith("/")) return false;
  const [firstSegment, ...rest] = key.split("/");
  return rest.length > 0 && firstSegment === ownerId;
}

/**
 * Valide une URL fournie par le client avant de la stocker : elle doit
 * désigner un objet du bucket appartenant à `ownerId`.
 *
 * Barrière posée à l'ÉCRITURE, complémentaire du contrôle à la suppression :
 * une URL frauduleuse n'entre jamais en base.
 */
export function isOwnedObjectUrl(url: string, ownerId: string): boolean {
  return getObjectKeyFromUrl(url, ownerId) !== null;
}

export function assertOwnedObjectUrl(url: string, ownerId: string): void {
  if (!isOwnedObjectUrl(url, ownerId)) {
    throw new Error("Fichier invalide : l'URL ne correspond pas à un envoi de cet utilisateur");
  }
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
