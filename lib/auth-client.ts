import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins/two-factor";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    twoFactorClient({
      // Quand un compte 2FA tente de se connecter, better-auth signale qu'une
      // vérification est nécessaire : on redirige vers l'écran de saisie du code.
      onTwoFactorRedirect() {
        window.location.href = "/login/2fa";
      },
    }),
  ],
});
