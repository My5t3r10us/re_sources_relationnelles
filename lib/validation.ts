import { z } from "zod";
import {
  userRoleEnum,
  resourceStatusEnum,
  resourcePrivacyEnum,
  mediaTypeEnum,
  commentStatusEnum,
  reportReasonEnum,
} from "@/db/schema";

/**
 * Schémas de validation partagés entre les routes API et les Server Actions.
 *
 * Les énumérations dérivent directement des enums Drizzle : ajouter une valeur
 * au schéma de base la propage ici, au lieu de créer une divergence silencieuse
 * entre ce que la base accepte et ce que l'application valide.
 *
 * Toute Server Action exportée étant une route HTTP réelle, ses arguments
 * doivent passer par un de ces schémas — les types TypeScript ne sont pas une
 * validation.
 */

export const roleSchema = z.enum(userRoleEnum.enumValues);
export const resourceStatusSchema = z.enum(resourceStatusEnum.enumValues);
export const resourcePrivacySchema = z.enum(resourcePrivacyEnum.enumValues);
export const mediaTypeSchema = z.enum(mediaTypeEnum.enumValues);
export const commentStatusSchema = z.enum(commentStatusEnum.enumValues);
export const reportReasonSchema = z.enum(reportReasonEnum.enumValues);

/** URL http(s) bornée — évite d'insérer des chaînes arbitraires en base. */
const httpUrl = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), { message: "URL invalide" });

/**
 * Politique de mot de passe appliquée CÔTÉ SERVEUR.
 * L'attribut `minLength` du formulaire d'inscription ne contraint que le
 * navigateur ; il est trivialement contournable.
 */
export const MIN_PASSWORD_LENGTH = 12;

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères`)
  .max(256);

export const attachmentSchema = z.object({
  url: httpUrl,
  name: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(160),
});

export const resourceInputSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(200),
  content: z.string().trim().min(1, "Le contenu est requis").max(100_000),
  summary: z.string().trim().max(500).optional().nullable(),
  mediaType: mediaTypeSchema.default("article"),
  categoryId: z.string().trim().max(200).optional().nullable(),
  privacy: resourcePrivacySchema.default("public"),
  isDraft: z.boolean().optional().default(false),
  imageUrl: httpUrl.optional().nullable(),
  attachments: z.array(attachmentSchema).max(20).optional(),
});
export type ResourceInput = z.infer<typeof resourceInputSchema>;

export const commentInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(2000, "Le commentaire est trop long (max 2000 caractères)"),
  parentId: z.string().trim().max(64).optional().nullable(),
});

export const reportInputSchema = z
  .object({
    reason: reportReasonSchema,
    description: z.string().trim().max(2000).optional().nullable(),
    resourceId: z.string().trim().max(64).optional().nullable(),
    commentId: z.string().trim().max(64).optional().nullable(),
  })
  .refine((v) => Boolean(v.resourceId) !== Boolean(v.commentId), {
    message: "Préciser soit resourceId, soit commentId",
  });

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  firstName: z.string().trim().max(120).optional().nullable(),
  lastName: z.string().trim().max(120).optional().nullable(),
  image: httpUrl.optional().nullable(),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Le slug est requis")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (minuscules, chiffres et tirets)"),
  description: z.string().trim().max(1000).optional().nullable(),
  icon: z.string().trim().max(120).optional().nullable(),
});

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  email: z.string().trim().toLowerCase().email("Email invalide").max(254),
  password: passwordSchema,
  role: z.enum(["moderator", "admin", "super_admin"]),
});

export const sessionMessageSchema = z.object({
  content: z.string().trim().min(1, "Le message ne peut pas être vide").max(2000),
});

/**
 * Suppression de compte par son titulaire (art. 17 RGPD).
 *
 * Le mot de passe est revérifié à ce moment précis : un cookie de session volé
 * ne doit pas suffire à effacer un compte. Aucune contrainte de longueur ici —
 * on valide un mot de passe existant, pas on en crée un.
 */
export const accountDeletionSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis").max(512),
  confirmation: z.literal("SUPPRIMER", {
    message: "Saisissez SUPPRIMER pour confirmer",
  }),
});

/**
 * Réduit une erreur Zod à un message unique, lisible par l'utilisateur.
 * Les routes API le passent à `apiError(...)`, les Server Actions à `Error`.
 */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides";
}

/** Parse ou lève une `Error` — forme attendue par les Server Actions. */
export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error(firstIssueMessage(result.error));
  return result.data;
}
