import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { getPublicUrl, uploadObject } from "@/lib/s3";

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

  const { name: filename, type: contentType, size } = file;

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé" },
      { status: 400 }
    );
  }

  if (size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 50 Mo)" },
      { status: 400 }
    );
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin";
  const objectName = `${session.user.id}/${crypto.randomUUID()}.${safeExt}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadObject(objectName, buffer, contentType);
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
