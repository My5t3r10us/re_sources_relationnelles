import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { getPublicUrl, uploadObject } from "@/lib/s3";
import { detectContentType } from "@/lib/file-type";
import { checkRateLimit, requestIdentity, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Types réellement acceptés, comparés au type DÉTECTÉ dans les octets du
 * fichier — jamais à celui déclaré par le client.
 */
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
];

/** Extension canonique par type, pour ne pas dépendre du nom fourni. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 50 Mo par requête sans plafond permettait de saturer le bucket.
  const verdict = await checkRateLimit(
    "upload",
    requestIdentity(req, session.user.id),
    RATE_LIMITS.upload
  );
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "Trop d'envois. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfter) } }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 50 Mo)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Le type vient des octets, pas de `file.type`.
  const detectedType = detectContentType(buffer);
  if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé" },
      { status: 400 }
    );
  }

  const ext = EXTENSION_BY_TYPE[detectedType] ?? "bin";
  const objectName = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

  try {
    await uploadObject(objectName, buffer, detectedType);
    const publicUrl = getPublicUrl(objectName);
    return NextResponse.json({ publicUrl });
  } catch (err) {
    console.error("S3 error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}
