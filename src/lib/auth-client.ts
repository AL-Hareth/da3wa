"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        locale: { type: "string", required: false },
        accountType: { type: "string", required: false, input: false },
        onboardedAt: { type: "date", required: false, input: false },
      },
    }),
  ],
});
