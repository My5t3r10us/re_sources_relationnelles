import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
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
