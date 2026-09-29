import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "./db";
import { env } from "./env";
import { newId } from "./ids";
import { actionEmail, sendMail } from "./mailer";
import { ensurePersonalWorkspace } from "./workspace";
import { purgeUserMedia } from "./account";

function createAuth() {
  const e = env();
  const google =
    e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET, prompt: "select_account" as const } }
      : {};

  return betterAuth({
    appName: e.APP_NAME,
    baseURL: e.APP_URL,
    secret: e.AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: e.REQUIRE_EMAIL_VERIFICATION,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendMail({
          to: user.email,
          subject: "إعادة تعيين كلمة المرور | Reset your password",
          ...actionEmail({
            titleAr: "إعادة تعيين كلمة المرور",
            titleEn: "Reset your password",
            bodyAr: "وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. الرابط صالح لمدة ساعة.",
            bodyEn: "We received a request to reset your password. The link is valid for one hour.",
            ctaAr: "تعيين كلمة مرور جديدة",
            ctaEn: "Set a new password",
            url,
          }),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: e.REQUIRE_EMAIL_VERIFICATION,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail({
          to: user.email,
          subject: "تأكيد البريد الإلكتروني | Confirm your email",
          ...actionEmail({
            titleAr: "أهلاً بك في دعوة",
            titleEn: "Welcome to Da3wa",
            bodyAr: "اضغط على الزر لتأكيد بريدك الإلكتروني وتفعيل حسابك.",
            bodyEn: "Confirm your email address to activate your account.",
            ctaAr: "تأكيد البريد",
            ctaEn: "Confirm email",
            url,
          }),
        });
      },
    },
    socialProviders: google,
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    user: {
      additionalFields: {
        locale: { type: "string", required: false, defaultValue: "ar", input: true },
        accountType: { type: "string", required: false, defaultValue: "individual", input: false },
        onboardedAt: { type: "date", required: false, input: false },
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await purgeUserMedia(user.id);
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    rateLimit: {
      enabled: e.NODE_ENV === "production",
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 300, max: 5 },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensurePersonalWorkspace(user.id, user.name);
          },
        },
      },
    },
    advanced: {
      database: { generateId: () => newId() },
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"] },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

/** Lazily constructed so builds don't require runtime secrets. */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}

export type Session = Auth["$Infer"]["Session"];
