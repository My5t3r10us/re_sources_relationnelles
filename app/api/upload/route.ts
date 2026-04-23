import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { getMinioClient, MINIO_BUCKET, getMinioPublicUrl } from "@/lib/minio";

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

const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { filename?: string; contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { filename, contentType, size } = body;

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé" },
      { status: 400 }
    );
  }

  if (size && size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 50 Mo)" },
      { status: 400 }
    );
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin";
  const objectName = `${session.user.id}/${crypto.randomUUID()}.${safeExt}`;

  try {
    const client = getMinioClient();
    // Presigned URL valide 15 minutes
    const uploadUrl = await client.presignedPutObject(
      MINIO_BUCKET,
      objectName,
      15 * 60
    );
    const publicUrl = getMinioPublicUrl(objectName);

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error("MinIO error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'URL d'upload" },
      { status: 500 }
    );
  }
}
