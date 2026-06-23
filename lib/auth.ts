import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { authLog } from "@/db/schema";

export const auth = betterAuth({
  plugins: [
    bearer(),
    // Double authentification TOTP (compatible Microsoft Authenticator & co).
    // skipVerificationOnEnable laissé à false : l'utilisateur doit valider un code
    // avant que le 2FA soit réellement actif → pas de lock-out sur un QR mal scanné.
    twoFactor({ issuer: "(RE)Sources Relationnelles" }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19000",
    "http://localhost:19006",
    "http://10.0.2.2:3000",
    "https://resource.baptistemoine.dev",
    "re-sources://",
    "exp://*",
  ],
  advanced: {
    // Force le flag « Secure » sur les cookies en production (HTTPS uniquement).
    // Laissé désactivé en dev pour que le login fonctionne sur http://localhost.
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  session: {
    // Durée de validité courte : la session expire après 24h.
    expiresIn: 60 * 60 * 24, // 1 jour
    // Renouvellement glissant : tant que l'utilisateur est actif, l'expiration
    // est repoussée au plus une fois par heure.
    updateAge: 60 * 60, // 1 heure
  },
  databaseHooks: {
    session: {
      create: {
        // Une session est créée à chaque connexion réussie (web + mobile) :
        // on journalise l'évènement de façon best-effort, sans bloquer le login.
        after: async (session) => {
          try {
            await db.insert(authLog).values({
              id: crypto.randomUUID(),
              userId: session.userId,
              event: "login",
              ipAddress: session.ipAddress || null,
              userAgent: session.userAgent || null,
            });
          } catch (err) {
            console.error("[auth_log] échec de journalisation de la connexion", err);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
        input: true,
        fieldName: "firstName",
      },
      lastName: {
        type: "string",
        required: false,
        input: true,
        fieldName: "lastName",
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "citizen",
        input: false,
        fieldName: "role",
      },
      active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
        fieldName: "active",
      },
    },
  },
});
