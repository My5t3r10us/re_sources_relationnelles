import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  plugins: [bearer()],
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
    disableCSRFCheck: true,
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
