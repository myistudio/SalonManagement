import { pgTable, text, integer, real, boolean, timestamp, serial, varchar, date, decimal } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email').unique().notNull(),
  mobile: varchar('mobile'),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name'),
  password: varchar('password').notNull(),
  role: varchar('role').default('executive').notNull(),
  isActive: boolean('is_active').default(true),
  profileImageUrl: varchar('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Stores table
export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  address: text('address'),
  city: varchar('city'),
  state: varchar('state'),
  zipCode: varchar('zip_code'),
  phone: varchar('phone'),
  email: varchar('email'),
  description: text('description'),
  gstNumber: varchar('gst_number'),
  logoUrl: text('logo_url'),
  enableTax: boolean('enable_tax').default(true),
  taxName: varchar('tax_name').default('GST'),
  taxRate: real('tax_rate').default(18.00),
  isActive: boolean('is_active').default(true),
  themeColor: varchar('theme_color').default('#8B5CF6'),
  openingTime: varchar('opening_time').default('09:00'),
  closingTime: varchar('closing_time').default('18:00'),
  slotDuration: integer('slot_duration').default(30),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Store staff table
export const storeStaff = pgTable('store_staff', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  userId: varchar('user_id').notNull().references(() => users.id),
  role: varchar('role').default('executive').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name'),
  mobile: varchar('mobile').notNull(),
  email: varchar('email'),
  dateOfBirth: varchar('date_of_birth'),
  gender: varchar('gender'),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalVisits: integer('total_visits').default(0),
  totalSpent: real('total_spent').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Membership plans table
export const membershipPlans = pgTable('membership_plans', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: varchar('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  durationMonths: integer('duration_months').notNull(),
  discountPercentage: real('discount_percentage').default(0),
  pointsMultiplier: real('points_multiplier').default(1.0),
  benefits: text('benefits'), // JSON string
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Customer memberships table
export const customerMemberships = pgTable('customer_memberships', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  membershipPlanId: integer('membership_plan_id').notNull().references(() => membershipPlans.id),
  startDate: varchar('start_date').notNull(),
  endDate: varchar('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Services table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: varchar('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  duration: integer('duration').default(60),
  categoryId: integer('category_id').references(() => serviceCategories.id),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Service categories table
export const serviceCategories = pgTable('service_categories', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: varchar('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Product categories table
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: varchar('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: varchar('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  cost: real('cost').default(0),
  barcode: varchar('barcode'),
  categoryId: integer('category_id').references(() => productCategories.id),
  brand: varchar('brand'),
  stock: integer('stock').default(0),
  minStock: integer('min_stock').default(0),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  customerId: integer('customer_id').references(() => customers.id),
  invoiceNumber: varchar('invoice_number').notNull(),
  subtotal: real('subtotal').notNull(),
  discountAmount: real('discount_amount').default(0),
  taxAmount: real('tax_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: varchar('payment_method').default('cash'),
  staffId: varchar('staff_id').references(() => users.id),
  pointsEarned: integer('points_earned').default(0),
  pointsRedeemed: integer('points_redeemed').default(0),
  membershipDiscount: real('membership_discount').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Transaction items table
export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').notNull().references(() => transactions.id),
  itemType: varchar('item_type').notNull(), // 'service' or 'product'
  itemId: integer('item_id').notNull(),
  itemName: varchar('item_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  serviceStaffId: varchar('service_staff_id').references(() => users.id),
  membershipPlanId: integer('membership_plan_id').references(() => membershipPlans.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Appointments table (matches actual database schema)
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  customerName: varchar('customer_name').notNull(),
  customerMobile: varchar('customer_mobile').notNull(),
  customerPhone: varchar('customer_phone'),
  customerEmail: varchar('customer_email'),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender'),
  appointmentDate: date('appointment_date').notNull(),
  appointmentTime: varchar('appointment_time').notNull(),
  serviceIds: text('service_ids').array().notNull(), // Array of service IDs
  serviceName: text('service_name').notNull(),
  totalAmount: decimal('total_amount').notNull(),
  duration: integer('duration').notNull(),
  status: varchar('status').default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Appointment settings table
export const appointmentSettings = pgTable('appointment_settings', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  openingTime: varchar('opening_time').default('09:00'),
  closingTime: varchar('closing_time').default('18:00'),
  slotDuration: integer('slot_duration').default(30),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Login page settings table
export const loginPageSettings = pgTable('login_page_settings', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name').default('SalonPro'),
  logoUrl: text('logo_url'),
  welcomeMessage: text('welcome_message').default('Welcome to your salon management system'),
  footerText: text('footer_text').default('Designed by - My Internet'),
  primaryColor: varchar('primary_color').default('#8B5CF6'),
  backgroundImage: text('background_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  storeStaff: many(storeStaff),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  staff: many(storeStaff),
  customers: many(customers),
  services: many(services),
  products: many(products),
  transactions: many(transactions),
  membershipPlans: many(membershipPlans),
  serviceCategories: many(serviceCategories),
  productCategories: many(productCategories),
  appointments: many(appointments),
}));

export const storeStaffRelations = relations(storeStaff, ({ one }) => ({
  user: one(users, { fields: [storeStaff.userId], references: [users.id] }),
  store: one(stores, { fields: [storeStaff.storeId], references: [stores.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  store: one(stores, { fields: [customers.storeId], references: [stores.id] }),
  transactions: many(transactions),
  memberships: many(customerMemberships),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ one, many }) => ({
  store: one(stores, { fields: [membershipPlans.storeId], references: [stores.id] }),
  customerMemberships: many(customerMemberships),
}));

export const customerMembershipsRelations = relations(customerMemberships, ({ one }) => ({
  customer: one(customers, { fields: [customerMemberships.customerId], references: [customers.id] }),
  membershipPlan: one(membershipPlans, { fields: [customerMemberships.membershipPlanId], references: [membershipPlans.id] }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  store: one(stores, { fields: [services.storeId], references: [stores.id] }),
  category: one(serviceCategories, { fields: [services.categoryId], references: [serviceCategories.id] }),
  transactionItems: many(transactionItems),
}));

export const servicesCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  store: one(stores, { fields: [serviceCategories.storeId], references: [stores.id] }),
  services: many(services),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  store: one(stores, { fields: [productCategories.storeId], references: [stores.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
  transactionItems: many(transactionItems),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  store: one(stores, { fields: [transactions.storeId], references: [stores.id] }),
  customer: one(customers, { fields: [transactions.customerId], references: [customers.id] }),
  staff: one(users, { fields: [transactions.staffId], references: [users.id] }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionItems.transactionId], references: [transactions.id] }),
  serviceStaff: one(users, { fields: [transactionItems.serviceStaffId], references: [users.id] }),
  membershipPlan: one(membershipPlans, { fields: [transactionItems.membershipPlanId], references: [membershipPlans.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  store: one(stores, { fields: [appointments.storeId], references: [stores.id] }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;
export type StoreStaff = typeof storeStaff.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = typeof membershipPlans.$inferInsert;
export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = typeof serviceCategories.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = typeof transactionItems.$inferInsert;
export type LoginPageSettings = typeof loginPageSettings.$inferSelect;
export type InsertLoginPageSettings = typeof loginPageSettings.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertStoreSchema = createInsertSchema(stores);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertMembershipPlanSchema = createInsertSchema(membershipPlans);
export const insertServiceSchema = createInsertSchema(services);
export const insertServiceCategorySchema = createInsertSchema(serviceCategories);
export const insertProductCategorySchema = createInsertSchema(productCategories);
export const insertProductSchema = createInsertSchema(products);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertTransactionItemSchema = createInsertSchema(transactionItems);
export const insertLoginPageSettingsSchema = createInsertSchema(loginPageSettings);