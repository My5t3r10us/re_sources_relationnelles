/**
 * Détection du type réel d'un fichier à partir de ses octets d'en-tête.
 *
 * Le `Content-Type` d'un upload est déclaré par le client : il servait à la
 * fois de filtre d'autorisation et d'en-tête renvoyé par le bucket public.
 * N'importe quel contenu pouvait donc être hébergé sous une étiquette d'image.
 * Le type est désormais dérivé des octets, jamais de la déclaration.
 */

type Signature = {
  contentType: string;
  /** Octets attendus ; `null` = position ignorée. */
  magic: (number | null)[];
  offset?: number;
};

const SIGNATURES: Signature[] = [
  { contentType: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { contentType: "image/png", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { contentType: "image/gif", magic: [0x47, 0x49, 0x46, 0x38] },
  { contentType: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  // ID3 (MP3 avec métadonnées) puis trame MPEG brute.
  { contentType: "audio/mpeg", magic: [0x49, 0x44, 0x33] },
  { contentType: "audio/mpeg", magic: [0xff, 0xfb] },
  { contentType: "audio/mpeg", magic: [0xff, 0xf3] },
  { contentType: "audio/mpeg", magic: [0xff, 0xf2] },
  // OGG (audio/ogg)
  { contentType: "audio/ogg", magic: [0x4f, 0x67, 0x67, 0x53] },
];

function matches(bytes: Uint8Array, sig: Signature): boolean {
  const offset = sig.offset ?? 0;
  if (bytes.length < offset + sig.magic.length) return false;
  return sig.magic.every((b, i) => b === null || bytes[offset + i] === b);
}

/** RIFF….WEBP — l'identifiant de format est au huitième octet. */
function isWebp(b: Uint8Array): boolean {
  return (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  );
}

/**
 * Conteneur ISO-BMFF (`....ftyp<marque>`) : MP4 et M4A partagent la même
 * structure, seule la marque les distingue.
 */
function isoBmffBrand(b: Uint8Array): string | null {
  if (b.length < 12) return null;
  if (!(b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70)) return null;
  return String.fromCharCode(b[8], b[9], b[10], b[11]);
}

/** WebM / Matroska (EBML). */
function isWebm(b: Uint8Array): boolean {
  return b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
}

/**
 * Retourne le type MIME réel du contenu, ou `null` si aucune signature connue
 * ne correspond — auquel cas l'upload doit être refusé.
 */
export function detectContentType(bytes: Uint8Array): string | null {
  if (isWebp(bytes)) return "image/webp";
  if (isWebm(bytes)) return "video/webm";

  const brand = isoBmffBrand(bytes);
  if (brand) {
    if (brand.startsWith("M4A")) return "audio/mp4";
    // isom, mp42, avc1, iso5… tous des conteneurs MP4.
    return "video/mp4";
  }

  for (const sig of SIGNATURES) {
    if (matches(bytes, sig)) return sig.contentType;
  }
  return null;
}
