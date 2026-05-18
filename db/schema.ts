import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "citizen",
  "moderator",
  "admin",
  "super_admin",
]);

export const resourceStatusEnum = pgEnum("resource_status", [
  "draft",
  "pending",
  "published",
  "rejected",
  "flagged",
]);

export const resourcePrivacyEnum = pgEnum("resource_privacy", [
  "public",
  "private",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "article",
  "video",
  "pdf",
  "exercise",
  "audio",
  "protocol",
]);

export const commentStatusEnum = pgEnum("comment_status", [
  "visible",
  "hidden",
  "flagged",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "harassment",
  "spam",
  "misinformation",
  "inappropriate",
  "other",
]);

export const sessionStatusEnum = pgEnum("session_status", ["active", "ended"]);

// ─── Auth tables (better-auth) ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum("role").notNull().default("citizen"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Business tables ───

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resource = pgTable("resource", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  mediaType: mediaTypeEnum("media_type").notNull().default("article"),
  privacy: resourcePrivacyEnum("privacy").notNull().default("public"),
  status: resourceStatusEnum("status").notNull().default("draft"),
  categoryId: text("category_id").references(() => category.id, {
    onDelete: "set null",
  }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  readingTime: integer("reading_time"),
  featured: boolean("featured").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  region: text("region"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  status: commentStatusEnum("status").notNull().default("visible"),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const favorite = pgTable("favorite", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const completion = pgTable("completion", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const report = pgTable("report", {
  id: text("id").primaryKey(),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description"),
  resourceId: text("resource_id").references(() => resource.id, {
    onDelete: "cascade",
  }),
  commentId: text("comment_id").references(() => comment.id, {
    onDelete: "cascade",
  }),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commentLike = pgTable("comment_like", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  commentId: text("comment_id")
    .notNull()
    .references(() => comment.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedResource = pgTable("saved_resource", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resourceFile = pgTable("resource_file", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Collaborative sessions ───

export const resourceSession = pgTable("resource_session", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  hostId: text("host_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  shareCode: text("share_code").notNull().unique(),
  status: sessionStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const sessionParticipant = pgTable("session_participant", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => resourceSession.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  leftAt: timestamp("left_at"),
});

export const sessionMessage = pgTable("session_message", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => resourceSession.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ───

export const userRelations = relations(user, ({ many }) => ({
  resources: many(resource),
  comments: many(comment),
  favorites: many(favorite),
  completions: many(completion),
  savedResources: many(savedResource),
}));

export const savedResourceRelations = relations(savedResource, ({ one }) => ({
  user: one(user, { fields: [savedResource.userId], references: [user.id] }),
  resource: one(resource, {
    fields: [savedResource.resourceId],
    references: [resource.id],
  }),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  resources: many(resource),
}));

export const resourceRelations = relations(resource, ({ one, many }) => ({
  author: one(user, { fields: [resource.authorId], references: [user.id] }),
  category: one(category, {
    fields: [resource.categoryId],
    references: [category.id],
  }),
  comments: many(comment),
  favorites: many(favorite),
  completions: many(completion),
  files: many(resourceFile),
}));

export const resourceFileRelations = relations(resourceFile, ({ one }) => ({
  resource: one(resource, {
    fields: [resourceFile.resourceId],
    references: [resource.id],
  }),
}));

export const commentRelations = relations(comment, ({ one, many }) => ({
  resource: one(resource, {
    fields: [comment.resourceId],
    references: [resource.id],
  }),
  author: one(user, { fields: [comment.authorId], references: [user.id] }),
  likes_rel: many(commentLike),
}));

export const commentLikeRelations = relations(commentLike, ({ one }) => ({
  user: one(user, { fields: [commentLike.userId], references: [user.id] }),
  comment: one(comment, {
    fields: [commentLike.commentId],
    references: [comment.id],
  }),
}));

export const favoriteRelations = relations(favorite, ({ one }) => ({
  user: one(user, { fields: [favorite.userId], references: [user.id] }),
  resource: one(resource, {
    fields: [favorite.resourceId],
    references: [resource.id],
  }),
}));

export const completionRelations = relations(completion, ({ one }) => ({
  user: one(user, { fields: [completion.userId], references: [user.id] }),
  resource: one(resource, {
    fields: [completion.resourceId],
    references: [resource.id],
  }),
}));

export const resourceSessionRelations = relations(resourceSession, ({ one, many }) => ({
  resource: one(resource, {
    fields: [resourceSession.resourceId],
    references: [resource.id],
  }),
  host: one(user, { fields: [resourceSession.hostId], references: [user.id] }),
  participants: many(sessionParticipant),
  messages: many(sessionMessage),
}));

export const sessionParticipantRelations = relations(sessionParticipant, ({ one }) => ({
  session: one(resourceSession, {
    fields: [sessionParticipant.sessionId],
    references: [resourceSession.id],
  }),
  user: one(user, { fields: [sessionParticipant.userId], references: [user.id] }),
}));

export const sessionMessageRelations = relations(sessionMessage, ({ one }) => ({
  session: one(resourceSession, {
    fields: [sessionMessage.sessionId],
    references: [resourceSession.id],
  }),
  author: one(user, { fields: [sessionMessage.authorId], references: [user.id] }),
}));
