import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { newId } from "../ids";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => newId());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const accountTypeEnum = pgEnum("account_type", ["individual", "designer", "planner"]);
export const workspaceKindEnum = pgEnum("workspace_kind", ["personal", "studio"]);
export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "editor"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "archived"]);
export const eventTierEnum = pgEnum("event_tier", ["free", "standard", "premium"]);
export const eventTypeEnum = pgEnum("event_type", [
  "wedding",
  "engagement",
  "birthday",
  "graduation",
  "henna",
  "corporate",
  "custom",
]);
export const languageModeEnum = pgEnum("language_mode", ["ar", "en", "bilingual"]);
export const designModeEnum = pgEnum("design_mode", ["upload", "template"]);
export const visibilityEnum = pgEnum("visibility", ["public", "private"]);
export const bannerTypeEnum = pgEnum("banner_type", ["announcement", "time_change", "venue_change"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["attending", "not_attending", "maybe"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "failed", "cancelled", "refunded"]);
export const creditKindEnum = pgEnum("credit_kind", ["standard", "premium"]);
export const creditReasonEnum = pgEnum("credit_reason", ["purchase", "redeem", "grant", "refund", "adjustment"]);

/* -------------------------------------------------------------------------- */
/*                         Auth (better-auth compatible)                      */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  locale: text("locale").notNull().default("ar"),
  accountType: accountTypeEnum("account_type").notNull().default("individual"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: id(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: id(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                 Workspaces                                 */
/* -------------------------------------------------------------------------- */
/*
 * Every user owns a personal workspace. Events, orders and credits belong to a
 * workspace rather than a user so teams, designer studios and white-labelling
 * can be layered on later without migrating ownership.
 */

export const workspace = pgTable(
  "workspace",
  {
    id: id(),
    name: text("name").notNull(),
    kind: workspaceKindEnum("kind").notNull().default("personal"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Reserved for future white-labelling.
    brandName: text("brand_name"),
    brandLogo: jsonb("brand_logo").$type<ImageAsset>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("workspace_owner_idx").on(t.ownerId)],
);

export const workspaceMember = pgTable(
  "workspace_member",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("owner"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] }), index("workspace_member_user_idx").on(t.userId)],
);

/* -------------------------------------------------------------------------- */
/*                                   Events                                   */
/* -------------------------------------------------------------------------- */

export type ImageVariant = { width: number; key: string };
export type ImageAsset = {
  id: string;
  width: number;
  height: number;
  variants: ImageVariant[];
  /** JPEG used for link previews (WhatsApp, Messenger, ...). */
  ogKey: string;
  blurDataUrl: string;
};

export const event = pgTable(
  "event",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),

    status: eventStatusEnum("status").notNull().default("draft"),
    tier: eventTierEnum("tier").notNull().default("free"),
    type: eventTypeEnum("type").notNull().default("wedding"),
    slug: text("slug").notNull().unique(),
    /** Designer / planner reference, never shown publicly. */
    clientName: text("client_name"),

    languageMode: languageModeEnum("language_mode").notNull().default("ar"),
    titleAr: text("title_ar"),
    titleEn: text("title_en"),
    hostNamesAr: text("host_names_ar"),
    hostNamesEn: text("host_names_en"),
    greetingAr: text("greeting_ar"),
    greetingEn: text("greeting_en"),

    eventDate: date("event_date", { mode: "string" }),
    startTime: text("start_time"),
    endTime: text("end_time"),
    timezone: text("timezone").notNull().default("Asia/Riyadh"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    showHijriDate: boolean("show_hijri_date").notNull().default(false),
    showCountdown: boolean("show_countdown").notNull().default(true),

    venueNameAr: text("venue_name_ar"),
    venueNameEn: text("venue_name_en"),
    venueAddressAr: text("venue_address_ar"),
    venueAddressEn: text("venue_address_en"),
    mapsUrl: text("maps_url"),

    dressCodeAr: text("dress_code_ar"),
    dressCodeEn: text("dress_code_en"),
    notesAr: text("notes_ar"),
    notesEn: text("notes_en"),
    contactPhone: text("contact_phone"),
    shareMessage: text("share_message"),

    designMode: designModeEnum("design_mode").notNull().default("template"),
    themeId: text("theme_id").notNull().default("ivory-gold"),
    cardImage: jsonb("card_image").$type<ImageAsset>(),

    rsvpEnabled: boolean("rsvp_enabled").notNull().default(true),
    rsvpDeadline: date("rsvp_deadline", { mode: "string" }),
    rsvpMaxPartySize: integer("rsvp_max_party_size").notNull().default(5),
    rsvpAskPhone: boolean("rsvp_ask_phone").notNull().default(true),
    expectedInvites: integer("expected_invites"),

    visibility: visibilityEnum("visibility").notNull().default("public"),
    accessPin: text("access_pin"),

    bannerType: bannerTypeEnum("banner_type"),
    bannerTextAr: text("banner_text_ar"),
    bannerTextEn: text("banner_text_en"),
    bannerUpdatedAt: timestamp("banner_updated_at", { withTimezone: true }),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    firstPublishedAt: timestamp("first_published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("event_workspace_idx").on(t.workspaceId, t.createdAt)],
);

export const eventPhoto = pgTable(
  "event_photo",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    image: jsonb("image").$type<ImageAsset>().notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("event_photo_event_idx").on(t.eventId, t.sortOrder)],
);

export const rsvp = pgTable(
  "rsvp",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    status: rsvpStatusEnum("status").notNull(),
    partySize: integer("party_size").notNull().default(1),
    phone: text("phone"),
    note: text("note"),
    /** SHA-256 of the secret kept in the guest's cookie so they can edit their response. */
    editTokenHash: text("edit_token_hash").notNull(),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("rsvp_event_idx").on(t.eventId, t.createdAt)],
);

export const pageView = pgTable(
  "page_view",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    device: text("device"),
    referrer: text("referrer"),
    createdAt: createdAt(),
  },
  (t) => [index("page_view_event_idx").on(t.eventId, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*                              Billing & credits                             */
/* -------------------------------------------------------------------------- */

export const order = pgTable(
  "order",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    eventId: text("event_id").references(() => event.id, { onDelete: "set null" }),
    product: text("product").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    provider: text("provider").notNull(),
    providerRef: text("provider_ref"),
    status: orderStatusEnum("status").notNull().default("pending"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("order_workspace_idx").on(t.workspaceId, t.createdAt),
    uniqueIndex("order_provider_ref_idx")
      .on(t.provider, t.providerRef)
      .where(sql`${t.providerRef} is not null`),
  ],
);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: id(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    kind: creditKindEnum("kind").notNull(),
    delta: integer("delta").notNull(),
    reason: creditReasonEnum("reason").notNull(),
    orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
    eventId: text("event_id").references(() => event.id, { onDelete: "set null" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("credit_ledger_workspace_idx").on(t.workspaceId, t.kind)],
);

/* -------------------------------------------------------------------------- */
/*                         App-level rate limiting                            */
/* -------------------------------------------------------------------------- */

export const rateBucket = pgTable("rate_bucket", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export type User = typeof user.$inferSelect;
export type Workspace = typeof workspace.$inferSelect;
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type Rsvp = typeof rsvp.$inferSelect;
export type Order = typeof order.$inferSelect;
export type EventPhoto = typeof eventPhoto.$inferSelect;
export type EventStatus = Event["status"];
export type EventTier = Event["tier"];
export type EventType = Event["type"];
export type LanguageMode = Event["languageMode"];
export type RsvpStatus = Rsvp["status"];
export type BannerType = NonNullable<Event["bannerType"]>;
