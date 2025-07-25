import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for basic email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  mobile: varchar("mobile", { length: 15 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("executive"), // super_admin, store_manager, executive
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stores table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email"),
  description: text("description"),
  gstNumber: varchar("gst_number"),
  logoUrl: varchar("logo_url", { length: 500 }),
  enableTax: boolean("enable_tax").default(true),
  taxName: varchar("tax_name", { length: 50 }).default("GST"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18.00"),
  isActive: boolean("is_active").default(true),
  themeColor: varchar("theme_color").default("#8B5CF6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store staff mapping
export const storeStaff = pgTable("store_staff", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull(), // store_manager, executive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  mobile: varchar("mobile", { length: 15 }).notNull(),
  email: varchar("email"),
  dateOfBirth: date("date_of_birth"),
  anniversaryDate: date("anniversary_date"),
  gender: varchar("gender", { length: 10 }),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalVisits: integer("total_visits").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration"), // in minutes
  categoryId: integer("category_id").references(() => serviceCategories.id),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories table
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service categories table
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  barcode: varchar("barcode").unique(),
  qrCode: text("qr_code"),
  categoryId: integer("category_id").references(() => productCategories.id),
  brand: varchar("brand"),
  stock: integer("stock").default(0),
  minStock: integer("min_stock").default(5),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Membership plans table
export const membershipPlans = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Gold, Silver, VIP
  description: text("description"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).default("1"),
  validityDays: integer("validity_days").default(365),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  benefits: jsonb("benefits"), // array of benefits
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer memberships table
export const customerMemberships = pgTable("customer_memberships", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  membershipPlanId: integer("membership_plan_id").references(() => membershipPlans.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  staffId: varchar("staff_id").references(() => users.id).notNull(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").default("cash"), // cash, card, upi
  pointsEarned: integer("points_earned").default(0),
  pointsRedeemed: integer("points_redeemed").default(0),
  membershipDiscount: decimal("membership_discount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transaction items table (services and products)
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  itemType: varchar("item_type").notNull(), // service, product
  itemId: integer("item_id").notNull(), // references services.id or products.id
  itemName: varchar("item_name").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  serviceStaffId: varchar("service_staff_id").references(() => users.id), // staff who provided the service
});

// Loyalty settings table
export const loyaltySettings = pgTable("loyalty_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  pointsPerRupee: decimal("points_per_rupee", { precision: 5, scale: 2 }).default("0.01"), // 1 point per 100 rupees
  rupeesPerPoint: decimal("rupees_per_point", { precision: 5, scale: 2 }).default("1"), // 1 point = 1 rupee
  minRedemptionPoints: integer("min_redemption_points").default(100),
  maxRedemptionPercentage: decimal("max_redemption_percentage", { precision: 5, scale: 2 }).default("50"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Business API settings table
export const whatsappSettings = pgTable("whatsapp_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  accessToken: text("access_token"),
  phoneNumberId: text("phone_number_id"),
  businessAccountId: text("business_account_id"),
  webhookVerifyToken: text("webhook_verify_token"),
  isEnabled: boolean("is_enabled").default(false),
  enableSaleNotifications: boolean("enable_sale_notifications").default(true),
  enableBirthdayMessages: boolean("enable_birthday_messages").default(true),
  enableAnniversaryMessages: boolean("enable_anniversary_messages").default(true),
  enableCampaignMessages: boolean("enable_campaign_messages").default(true),
  birthdayTime: text("birthday_time").default("10:00"), // HH:MM format
  anniversaryTime: text("anniversary_time").default("10:00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp message templates table
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'sale', 'birthday', 'anniversary', 'campaign'
  templateId: text("template_id"), // WhatsApp template ID
  content: text("content").notNull(),
  variables: text("variables").array(), // template variables like {{customer_name}}, {{store_name}}
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp message logs table
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  phoneNumber: text("phone_number").notNull(),
  messageType: text("message_type").notNull(), // 'sale', 'birthday', 'anniversary', 'campaign'
  templateId: integer("template_id").references(() => whatsappTemplates.id),
  content: text("content").notNull(),
  status: text("status").default("pending"), // 'pending', 'sent', 'delivered', 'failed'
  whatsappMessageId: text("whatsapp_message_id"),
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer campaigns table
export const customerCampaigns = pgTable("customer_campaigns", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  templateId: integer("template_id").references(() => whatsappTemplates.id),
  targetAudience: text("target_audience").notNull(), // 'all', 'members', 'recent_customers', 'custom'
  customFilters: jsonb("custom_filters"), // JSON filters for custom audience
  scheduledFor: timestamp("scheduled_for"),
  status: text("status").default("draft"), // 'draft', 'scheduled', 'sent', 'cancelled'
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Login page customization settings
export const loginPageSettings = pgTable("login_page_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).default("SalonPro"),
  tagline: text("tagline").default("Manage Your Beauty Business"),
  description: text("description").default("Complete salon management solution with billing, inventory, customer loyalty, and multi-store support."),
  logoUrl: varchar("logo_url", { length: 500 }),
  backgroundColor: varchar("background_color", { length: 50 }).default("from-purple-600 via-pink-600 to-indigo-600"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  storeStaff: many(storeStaff),
  transactions: many(transactions),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  staff: many(storeStaff),
  services: many(services),
  products: many(products),
  productCategories: many(productCategories),
  serviceCategories: many(serviceCategories),
  membershipPlans: many(membershipPlans),
  transactions: many(transactions),
  loyaltySettings: many(loyaltySettings),
  whatsappSettings: many(whatsappSettings),
  whatsappTemplates: many(whatsappTemplates),
  whatsappMessages: many(whatsappMessages),
  customerCampaigns: many(customerCampaigns),
  smsSettings: many(smsSettings),
  emailSettings: many(emailSettings),
  communicationTemplates: many(communicationTemplates),
  communicationMessages: many(communicationMessages),
  appointments: many(appointments),
  appointmentSettings: many(appointmentSettings),
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

export const customersRelations = relations(customers, ({ many }) => ({
  memberships: many(customerMemberships),
  transactions: many(transactions),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  store: one(stores, {
    fields: [services.storeId],
    references: [stores.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  store: one(stores, {
    fields: [productCategories.storeId],
    references: [stores.id],
  }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one }) => ({
  store: one(stores, {
    fields: [serviceCategories.storeId],
    references: [stores.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
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

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  store: one(stores, {
    fields: [transactions.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  staff: one(users, {
    fields: [transactions.staffId],
    references: [users.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
}));

export const loyaltySettingsRelations = relations(loyaltySettings, ({ one }) => ({
  store: one(stores, {
    fields: [loyaltySettings.storeId],
    references: [stores.id],
  }),
}));

export const whatsappSettingsRelations = relations(whatsappSettings, ({ one }) => ({
  store: one(stores, {
    fields: [whatsappSettings.storeId],
    references: [stores.id],
  }),
}));

export const whatsappTemplatesRelations = relations(whatsappTemplates, ({ one }) => ({
  store: one(stores, {
    fields: [whatsappTemplates.storeId],
    references: [stores.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  store: one(stores, {
    fields: [whatsappMessages.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [whatsappMessages.customerId],
    references: [customers.id],
  }),
  template: one(whatsappTemplates, {
    fields: [whatsappMessages.templateId],
    references: [whatsappTemplates.id],
  }),
}));

export const customerCampaignsRelations = relations(customerCampaigns, ({ one }) => ({
  store: one(stores, {
    fields: [customerCampaigns.storeId],
    references: [stores.id],
  }),
  template: one(whatsappTemplates, {
    fields: [customerCampaigns.templateId],
    references: [whatsappTemplates.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
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
  loyaltyPoints: true,
  totalVisits: true,
  totalSpent: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => val.toString()),
  cost: z.union([z.string(), z.number()]).transform(val => val.toString()).optional().nullable(),
});

export const insertMembershipPlanSchema = createInsertSchema(membershipPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => val.toString()),
  discountPercentage: z.union([z.string(), z.number()]).transform(val => val?.toString()).optional(),
  pointsMultiplier: z.union([z.string(), z.number()]).transform(val => val?.toString()).optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({
  id: true,
});

export const insertWhatsappSettingsSchema = createInsertSchema(whatsappSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerCampaignSchema = createInsertSchema(customerCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoginPageSettingsSchema = createInsertSchema(loginPageSettings).omit({
  id: true,
  updatedAt: true,
});

// Appointments table
// Appointment settings for each store
export const appointmentSettings = pgTable("appointment_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull().unique(),
  openingTime: varchar("opening_time", { length: 5 }).notNull().default("09:00"), // HH:MM format
  closingTime: varchar("closing_time", { length: 5 }).notNull().default("18:00"), // HH:MM format
  slotDuration: integer("slot_duration").notNull().default(30), // minutes
  maxConcurrentAppointments: integer("max_concurrent_appointments").notNull().default(3),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerMobile: varchar("customer_mobile", { length: 15 }).notNull(),
  customerEmail: varchar("customer_email"),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }), // male, female, other
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: varchar("appointment_time", { length: 10 }).notNull(), // HH:MM format
  serviceIds: text("service_ids").array().notNull(), // Array of service IDs
  serviceName: text("service_name").notNull(), // Concatenated service names
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // Total duration in minutes
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointment settings relations
export const appointmentSettingsRelations = relations(appointmentSettings, ({ one }) => ({
  store: one(stores, {
    fields: [appointmentSettings.storeId],
    references: [stores.id],
  }),
}));

// Appointment relations
export const appointmentRelations = relations(appointments, ({ one }) => ({
  store: one(stores, {
    fields: [appointments.storeId],
    references: [stores.id],
  }),
}));

export const insertAppointmentSettingsSchema = createInsertSchema(appointmentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.string().optional().nullable(),
  customerEmail: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// SMS Settings table
export const smsSettings = pgTable("sms_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  providerName: text("provider_name").notNull(), // 'msg91', 'smsgatewayhub', 'twilio', etc.
  apiKey: text("api_key"),
  senderId: text("sender_id"),
  templateId: text("template_id"),
  baseUrl: text("base_url"),
  isEnabled: boolean("is_enabled").default(false),
  enableAppointmentConfirmations: boolean("enable_appointment_confirmations").default(true),
  enableReminders: boolean("enable_reminders").default(true),
  enablePromotions: boolean("enable_promotions").default(true),
  reminderHoursBefore: integer("reminder_hours_before").default(24),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Settings table
export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  providerName: text("provider_name").notNull(), // 'smtp', 'sendgrid', 'gmail', etc.
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  isEnabled: boolean("is_enabled").default(false),
  enableAppointmentConfirmations: boolean("enable_appointment_confirmations").default(true),
  enableReminders: boolean("enable_reminders").default(true),
  enablePromotions: boolean("enable_promotions").default(true),
  enableRegistrationEmails: boolean("enable_registration_emails").default(true),
  reminderHoursBefore: integer("reminder_hours_before").default(24),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication Templates table (for SMS and Email)
export const communicationTemplates = pgTable("communication_templates", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'sms', 'email'
  category: text("category").notNull(), // 'appointment_confirmation', 'reminder', 'promotion', 'registration'
  subject: text("subject"), // For emails only
  content: text("content").notNull(),
  variables: text("variables").array(), // Available variables like {customer_name}, {appointment_time}, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication Messages Log table
export const communicationMessages = pgTable("communication_messages", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  type: text("type").notNull(), // 'sms', 'email', 'whatsapp'
  category: text("category").notNull(), // 'appointment_confirmation', 'reminder', 'promotion', 'registration'
  recipient: text("recipient").notNull(), // phone number or email
  subject: text("subject"), // For emails only
  content: text("content").notNull(),
  status: text("status").default("pending"), // 'pending', 'sent', 'delivered', 'failed'
  providerId: text("provider_id"), // External provider message ID
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Communication Preferences
export const customerCommunicationPreferences = pgTable("customer_communication_preferences", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  smsEnabled: boolean("sms_enabled").default(true),
  emailEnabled: boolean("email_enabled").default(true),
  whatsappEnabled: boolean("whatsapp_enabled").default(true),
  appointmentReminders: boolean("appointment_reminders").default(true),
  promotionalMessages: boolean("promotional_messages").default(true),
  birthdayMessages: boolean("birthday_messages").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced appointment table with staff assignment
export const appointmentStaff = pgTable("appointment_staff", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "cascade" }).notNull(),
  staffId: varchar("staff_id").references(() => users.id).notNull(),
  isAssigned: boolean("is_assigned").default(true),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Communication Settings Relations
export const smsSettingsRelations = relations(smsSettings, ({ one }) => ({
  store: one(stores, {
    fields: [smsSettings.storeId],
    references: [stores.id],
  }),
}));

export const emailSettingsRelations = relations(emailSettings, ({ one }) => ({
  store: one(stores, {
    fields: [emailSettings.storeId],
    references: [stores.id],
  }),
}));

export const communicationTemplatesRelations = relations(communicationTemplates, ({ one }) => ({
  store: one(stores, {
    fields: [communicationTemplates.storeId],
    references: [stores.id],
  }),
}));

export const communicationMessagesRelations = relations(communicationMessages, ({ one }) => ({
  store: one(stores, {
    fields: [communicationMessages.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [communicationMessages.customerId],
    references: [customers.id],
  }),
  appointment: one(appointments, {
    fields: [communicationMessages.appointmentId],
    references: [appointments.id],
  }),
}));

export const customerCommunicationPreferencesRelations = relations(customerCommunicationPreferences, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCommunicationPreferences.customerId],
    references: [customers.id],
  }),
}));

export const appointmentStaffRelations = relations(appointmentStaff, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentStaff.appointmentId],
    references: [appointments.id],
  }),
  staff: one(users, {
    fields: [appointmentStaff.staffId],
    references: [users.id],
  }),
}));

// Insert schemas for new tables
export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationMessageSchema = createInsertSchema(communicationMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerCommunicationPreferencesSchema = createInsertSchema(customerCommunicationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentStaffSchema = createInsertSchema(appointmentStaff).omit({
  id: true,
  assignedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type LoyaltySettings = typeof loyaltySettings.$inferSelect;
export type StoreStaff = typeof storeStaff.$inferSelect;
export type WhatsappSettings = typeof whatsappSettings.$inferSelect;
export type InsertWhatsappSettings = z.infer<typeof insertWhatsappSettingsSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type CustomerCampaign = typeof customerCampaigns.$inferSelect;
export type InsertCustomerCampaign = z.infer<typeof insertCustomerCampaignSchema>;
export type LoginPageSettings = typeof loginPageSettings.$inferSelect;
export type InsertLoginPageSettings = z.infer<typeof insertLoginPageSettingsSchema>;
export type AppointmentSettings = typeof appointmentSettings.$inferSelect;
export type InsertAppointmentSettings = z.infer<typeof insertAppointmentSettingsSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type SmsSettings = typeof smsSettings.$inferSelect;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type InsertCommunicationTemplate = z.infer<typeof insertCommunicationTemplateSchema>;
export type CommunicationMessage = typeof communicationMessages.$inferSelect;
export type InsertCommunicationMessage = z.infer<typeof insertCommunicationMessageSchema>;
export type CustomerCommunicationPreferences = typeof customerCommunicationPreferences.$inferSelect;
export type InsertCustomerCommunicationPreferences = z.infer<typeof insertCustomerCommunicationPreferencesSchema>;
export type AppointmentStaff = typeof appointmentStaff.$inferSelect;
export type InsertAppointmentStaff = z.infer<typeof insertAppointmentStaffSchema>;
