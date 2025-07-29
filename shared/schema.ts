import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  mobile: text('mobile'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  password: text('password').notNull(),
  role: text('role').default('executive').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Stores table
export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  phone: text('phone'),
  email: text('email'),
  description: text('description'),
  gstNumber: text('gst_number'),
  logoUrl: text('logo_url'),
  enableTax: integer('enable_tax', { mode: 'boolean' }).default(true),
  taxName: text('tax_name').default('GST'),
  taxRate: real('tax_rate').default(18.00),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  themeColor: text('theme_color').default('#8B5CF6'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Store staff table
export const storeStaff = sqliteTable('store_staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').default('executive').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Customers table
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  mobile: text('mobile').notNull(),
  email: text('email'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalVisits: integer('total_visits').default(0),
  totalSpent: real('total_spent').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Membership plans table
export const membershipPlans = sqliteTable('membership_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  durationMonths: integer('duration_months').notNull(),
  discountPercentage: real('discount_percentage').default(0),
  pointsMultiplier: real('points_multiplier').default(1.0),
  benefits: text('benefits'), // JSON string
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Customer memberships table
export const customerMemberships = sqliteTable('customer_memberships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  membershipPlanId: integer('membership_plan_id').notNull().references(() => membershipPlans.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Services table
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  duration: integer('duration').default(60),
  categoryId: integer('category_id').references(() => serviceCategories.id),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Service categories table
export const serviceCategories = sqliteTable('service_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Product categories table
export const productCategories = sqliteTable('product_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Products table
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  cost: real('cost').default(0),
  barcode: text('barcode'),
  categoryId: integer('category_id').references(() => productCategories.id),
  brand: text('brand'),
  stock: integer('stock').default(0),
  minStock: integer('min_stock').default(5),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  customerId: integer('customer_id').references(() => customers.id),
  invoiceNumber: text('invoice_number').unique().notNull(),
  subtotal: real('subtotal').notNull(),
  discountAmount: real('discount_amount').default(0),
  taxAmount: real('tax_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').default('Cash'),
  staffId: text('staff_id').references(() => users.id),
  pointsEarned: integer('points_earned').default(0),
  pointsRedeemed: integer('points_redeemed').default(0),
  membershipDiscount: real('membership_discount').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Transaction items table
export const transactionItems = sqliteTable('transaction_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id').notNull().references(() => transactions.id),
  itemType: text('item_type').notNull(), // 'service' or 'product'
  itemId: integer('item_id').notNull(),
  itemName: text('item_name').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  serviceStaffId: text('service_staff_id').references(() => users.id),
  membershipPlanId: integer('membership_plan_id').references(() => membershipPlans.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Login page settings table
export const loginPageSettings = sqliteTable('login_page_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyName: text('company_name').default('SalonPro'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#8B5CF6'),
  secondaryColor: text('secondary_color').default('#EC4899'),
  welcomeMessage: text('welcome_message').default('Welcome to our Salon Management System'),
  footerText: text('footer_text').default('Designed by - My Internet'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  storeStaff: many(storeStaff),
  transactions: many(transactions),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  staff: many(storeStaff),
  customers: many(customers),
  membershipPlans: many(membershipPlans),
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
  memberships: many(customerMemberships),
  transactions: many(transactions),
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

export const servicesRelations = relations(services, ({ one }) => ({
  store: one(stores, {
    fields: [services.storeId],
    references: [stores.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
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
  serviceStaff: one(users, {
    fields: [transactionItems.serviceStaffId],
    references: [users.id],
  }),
  membershipPlan: one(membershipPlans, {
    fields: [transactionItems.membershipPlanId],
    references: [membershipPlans.id],
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Store = typeof stores.$inferSelect;
export type StoreStaff = typeof storeStaff.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type LoginPageSettings = typeof loginPageSettings.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertStoreSchema = createInsertSchema(stores);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertMembershipPlanSchema = createInsertSchema(membershipPlans);
export const insertCustomerMembershipSchema = createInsertSchema(customerMemberships);
export const insertServiceSchema = createInsertSchema(services);
export const insertServiceCategorySchema = createInsertSchema(serviceCategories);
export const insertProductSchema = createInsertSchema(products);
export const insertProductCategorySchema = createInsertSchema(productCategories);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertTransactionItemSchema = createInsertSchema(transactionItems);
export const insertLoginPageSettingsSchema = createInsertSchema(loginPageSettings);

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type InsertCustomerMembership = z.infer<typeof insertCustomerMembershipSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type InsertLoginPageSettings = z.infer<typeof insertLoginPageSettingsSchema>;