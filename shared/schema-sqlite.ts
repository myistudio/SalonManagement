import {
  text,
  integer,
  real,
  sqliteTable,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for basic email/password authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  mobile: text("mobile").unique(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("executive"), // super_admin, store_manager, executive
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Stores table
export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  description: text("description"),
  gstNumber: text("gst_number"),
  logoUrl: text("logo_url"),
  enableTax: integer("enable_tax", { mode: "boolean" }).default(true),
  taxName: text("tax_name").default("GST"),
  taxRate: real("tax_rate").default(18.00),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  themeColor: text("theme_color").default("#8B5CF6"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Store staff mapping
export const storeStaff = sqliteTable("store_staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // store_manager, executive
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Customers table
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  mobile: text("mobile").notNull(),
  email: text("email"),
  dateOfBirth: text("date_of_birth"), // ISO date string
  gender: text("gender"),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalVisits: integer("total_visits").default(0),
  totalSpent: real("total_spent").default(0),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Membership plans
export const membershipPlans = sqliteTable("membership_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  discountPercentage: integer("discount_percentage").default(0),
  pointsMultiplier: integer("points_multiplier").default(1),
  benefits: text("benefits"), // JSON string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Customer memberships
export const customerMemberships = sqliteTable("customer_memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  membershipPlanId: integer("membership_plan_id").references(() => membershipPlans.id).notNull(),
  startDate: text("start_date").notNull(), // ISO date string
  endDate: text("end_date"), // ISO date string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at"),
});

// Services table
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  duration: integer("duration"),
  categoryId: integer("category_id"),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Products table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  cost: real("cost"),
  barcode: text("barcode").unique(),
  categoryId: integer("category_id"),
  brand: text("brand"),
  stock: integer("stock").default(0),
  minStock: integer("min_stock").default(5),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  staffId: text("staff_id").references(() => users.id),
  invoiceNumber: text("invoice_number").unique().notNull(),
  subtotal: real("subtotal").notNull(),
  discountAmount: real("discount_amount").default(0),
  taxAmount: real("tax_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  pointsEarned: integer("points_earned").default(0),
  pointsRedeemed: integer("points_redeemed").default(0),
  membershipDiscount: real("membership_discount").default(0),
  paymentMethod: text("payment_method").default("cash"),
  createdAt: integer("created_at"),
});

// Login page settings
export const loginPageSettings = sqliteTable("login_page_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").default("SalonPro"),
  logoUrl: text("logo_url"),
  welcomeMessage: text("welcome_message").default("Welcome to SalonPro"),
  tagline: text("tagline"),
  backgroundColor: text("background_color").default("#ffffff"),
  primaryColor: text("primary_color").default("#3b82f6"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Service categories
export const serviceCategories = sqliteTable("service_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Product categories
export const productCategories = sqliteTable("product_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  storeStaff: many(storeStaff),
  transactions: many(transactions),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  storeStaff: many(storeStaff),
  customers: many(customers),
  services: many(services),
  products: many(products),
  transactions: many(transactions),
}));

export const storeStaffRelations = relations(storeStaff, ({ one }) => ({
  store: one(stores, {
    fields: [storeStaff.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [storeStaff.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  store: one(stores, {
    fields: [customers.storeId],
    references: [stores.id],
  }),
  transactions: many(transactions),
  customerMemberships: many(customerMemberships),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ one, many }) => ({
  store: one(stores, {
    fields: [membershipPlans.storeId],
    references: [stores.id],
  }),
  customerMemberships: many(customerMemberships),
}));

export const customerMembershipsRelations = relations(customerMemberships, ({ one }) => ({
  customer: one(customers, {
    fields: [customerMemberships.customerId],
    references: [customers.id],
  }),
  membershipPlan: one(membershipPlans, {
    fields: [customerMemberships.membershipPlanId],
    references: [membershipPlans.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = InsertUser;

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = typeof membershipPlans.$inferInsert;

export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type InsertCustomerMembership = typeof customerMemberships.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMembershipPlanSchema = createInsertSchema(membershipPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => Number(val)),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => Number(val)),
  cost: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});