import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // No baseURL — auth-client uses window.location.origin automatically (same-origin)
  plugins: [
    emailOTPClient(),
  ],
});
