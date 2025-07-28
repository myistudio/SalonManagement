import {
  users,
  stores,
  storeStaff,
  customers,
  services,
  products,
  productCategories,
  serviceCategories,
  membershipPlans,
  customerMemberships,
  transactions,
  transactionItems,
  loyaltySettings,
  whatsappSettings,
  whatsappTemplates,
  whatsappMessages,
  customerCampaigns,
  loginPageSettings,
  appointments,
  appointmentSettings,
  appointmentStaff,
  smsSettings,
  emailSettings,
  communicationTemplates,
  communicationMessages,
  customerCommunicationPreferences,
  type User,
  type UpsertUser,
  type Store,
  type InsertStore,
  type Customer,
  type InsertCustomer,
  type Service,
  type InsertService,
  type Product,
  type InsertProduct,
  type ProductCategory,
  type InsertProductCategory,
  type ServiceCategory,
  type InsertServiceCategory,
  type MembershipPlan,
  type InsertMembershipPlan,
  type CustomerMembership,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
  type LoyaltySettings,
  type StoreStaff,
  type WhatsappSettings,
  type InsertWhatsappSettings,
  type WhatsappTemplate,
  type InsertWhatsappTemplate,
  type WhatsappMessage,
  type InsertWhatsappMessage,
  type CustomerCampaign,
  type InsertCustomerCampaign,
  type LoginPageSettings,
  type InsertLoginPageSettings,
  type Appointment,
  type InsertAppointment,
  type AppointmentSettings,
  type InsertAppointmentSettings,
  type SmsSettings,
  type InsertSmsSettings,
  type EmailSettings,
  type InsertEmailSettings,
  type CommunicationTemplate,
  type InsertCommunicationTemplate,
  type CommunicationMessage,
  type InsertCommunicationMessage,
  type CustomerCommunicationPreferences,
  type InsertCustomerCommunicationPreferences,
  type AppointmentStaff,
  type InsertAppointmentStaff,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, gte, lte, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (for basic email/password auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByEmailOrMobile(login: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Store operations
  getStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(id: number): Promise<void>;
  getUserStores(userId: string): Promise<Store[]>;
  getStoreStaff(storeId: number): Promise<(StoreStaff & { user: User })[]>;
  assignUserToStore(userId: string, storeId: number, role: string): Promise<StoreStaff>;

  // Customer operations
  getCustomers(storeId?: number): Promise<(Customer & { membership?: CustomerMembership & { membershipPlan: MembershipPlan } })[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByMobile(mobile: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  updateCustomerLoyalty(id: number, points: number, visits: number, spent: string): Promise<void>;
  getCustomerTransactions(customerId: number): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[]>;
  getCustomersWithSpending(storeId: number): Promise<any[]>;
  assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<void>;
  getStaffPerformance(storeId: number, startDate?: string, endDate?: string): Promise<any[]>;

  // Service category operations
  getServiceCategories(storeId: number): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory>;
  deleteServiceCategory(id: number): Promise<void>;

  // Service operations
  getServices(storeId: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Product category operations
  getProductCategories(storeId: number): Promise<ProductCategory[]>;
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory>;
  deleteProductCategory(id: number): Promise<void>;

  // Product operations
  getProducts(storeId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: number, quantity: number): Promise<void>;
  getLowStockProducts(storeId: number): Promise<Product[]>;

  // Membership operations
  getMembershipPlans(storeId: number): Promise<MembershipPlan[]>;
  getMembershipPlan(id: number): Promise<MembershipPlan | undefined>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan>;
  updateMembershipPlan(id: number, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlan>;
  deleteMembershipPlan(id: number): Promise<void>;
  getCustomerMembership(customerId: number): Promise<(CustomerMembership & { membershipPlan: MembershipPlan }) | undefined>;
  createCustomerMembership(membership: Omit<CustomerMembership, "id" | "createdAt">): Promise<CustomerMembership>;

  // Transaction operations
  getTransactions(storeId: number, limit?: number): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[]>;
  getTransaction(id: number): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] }) | undefined>;
  createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction>;
  generateInvoiceNumber(storeId: number): Promise<string>;

  // Loyalty operations
  getLoyaltySettings(storeId: number): Promise<LoyaltySettings | undefined>;
  updateLoyaltySettings(storeId: number, settings: Partial<LoyaltySettings>): Promise<LoyaltySettings>;

  // Dashboard stats
  getDashboardStats(storeId: number): Promise<{
    todayRevenue: string;
    customersToday: number;
    servicesToday: number;
    activeMembers: number;
  }>;

  // Reports
  getSalesReport(storeId: number, startDate: Date, endDate: Date): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    totalDiscount: string;
    topServices: { name: string; count: number; revenue: string }[];
    topProducts: { name: string; count: number; revenue: string }[];
  }>;
  getMembershipReport(storeId: number, startDate?: string, endDate?: string): Promise<any>;

  // Daily reports
  getDailySalesReport(storeId: number, date: Date): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    totalDiscount: string;
    cashCollection: string;
    upiCollection: string;
    cardCollection: string;
    paymentBreakdown: { method: string; amount: string; count: number }[];
  }>;

  // Staff performance reports
  getStaffPerformanceReport(storeId: number, startDate: Date, endDate: Date): Promise<{
    staffId: string;
    staffName: string;
    totalServices: number;
    totalRevenue: string;
    avgServiceValue: string;
    serviceBreakdown: { serviceName: string; count: number; revenue: string }[];
  }[]>;
  
  // Advanced analytics
  getAdvancedAnalytics(storeId: number, startDate: Date, endDate: Date): Promise<{
    dailyAnalytics: { date: string; revenue: string; transactions: number; discount: string }[];
    weekOnWeekComparison: { currentWeek: string; previousWeek: string; change: string };
    monthOnMonthComparison: { currentMonth: string; previousMonth: string; change: string };
  }>;

  // WhatsApp operations
  getWhatsappSettings(storeId: number): Promise<WhatsappSettings | undefined>;
  createWhatsappSettings(settings: InsertWhatsappSettings): Promise<WhatsappSettings>;
  updateWhatsappSettings(storeId: number, settings: Partial<WhatsappSettings>): Promise<WhatsappSettings>;
  getWhatsappTemplates(storeId: number): Promise<WhatsappTemplate[]>;
  createWhatsappTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate>;
  updateWhatsappTemplate(id: number, template: Partial<WhatsappTemplate>): Promise<WhatsappTemplate>;
  deleteWhatsappTemplate(id: number): Promise<void>;
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  updateWhatsappMessageStatus(messageId: number, status: string, providerId?: string, error?: string): Promise<void>;
  getWhatsappMessages(storeId: number, customerId?: number): Promise<WhatsappMessage[]>;
  createCustomerCampaign(campaign: InsertCustomerCampaign): Promise<CustomerCampaign>;
  getCustomerCampaigns(storeId: number): Promise<CustomerCampaign[]>;

  // Login page settings
  getLoginPageSettings(): Promise<LoginPageSettings | undefined>;
  updateLoginPageSettings(settings: Partial<LoginPageSettings>): Promise<LoginPageSettings>;

  // Appointment operations
  getAppointments(storeId: number, date?: Date): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  getAvailableTimeSlots(storeId: number, date: Date): Promise<string[]>;

  // Appointment settings operations
  getAppointmentSettings(storeId: number): Promise<AppointmentSettings | undefined>;
  createAppointmentSettings(settings: InsertAppointmentSettings): Promise<AppointmentSettings>;
  updateAppointmentSettings(storeId: number, settings: Partial<AppointmentSettings>): Promise<AppointmentSettings>;

  // Appointment staff operations
  getAppointmentStaff(appointmentId: number): Promise<any[]>;
  assignStaffToAppointment(appointmentId: number, staffId: string): Promise<any>;
  removeStaffFromAppointment(appointmentId: number, staffId: string): Promise<void>;

  // SMS Settings operations
  getSmsSettings(storeId: number): Promise<any | undefined>;
  createSmsSettings(settings: any): Promise<any>;
  updateSmsSettings(storeId: number, settings: any): Promise<any>;

  // Email Settings operations
  getEmailSettings(storeId: number): Promise<any | undefined>;
  createEmailSettings(settings: any): Promise<any>;
  updateEmailSettings(storeId: number, settings: any): Promise<any>;

  // Communication Templates operations
  getCommunicationTemplates(storeId: number): Promise<any[]>;
  getCommunicationTemplate(storeId: number, type: string, category: string): Promise<any | undefined>;
  createCommunicationTemplate(template: any): Promise<any>;
  updateCommunicationTemplate(id: number, template: any): Promise<any>;
  deleteCommunicationTemplate(id: number): Promise<void>;

  // Communication Messages operations
  getCommunicationMessages(storeId: number): Promise<any[]>;
  createCommunicationMessage(message: any): Promise<any>;

  // Customer Communication Preferences operations
  getCustomerCommunicationPreferences(customerId: number): Promise<any | undefined>;
  createCustomerCommunicationPreferences(preferences: any): Promise<any>;
  updateCustomerCommunicationPreferences(customerId: number, preferences: any): Promise<any>;

  // WhatsApp template helper
  getWhatsappTemplate(storeId: number, type: string): Promise<WhatsappTemplate | undefined>;

  // Customer spending and export operations
  getCustomersWithSpending(storeId: number): Promise<(Customer & { 
    currentYearSpending: string; 
    lifetimeSpending: string; 
    membershipPlan?: string 
  })[]>;
  getCustomerSpending(customerId: number): Promise<{
    currentYearSpending: string;
    lifetimeSpending: string;
  }>;
  exportCustomersToExcel(customers: any[]): Promise<Buffer>;
  assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<CustomerMembership>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile));
    return user;
  }

  async getUserByEmailOrMobile(login: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        login.includes('@') 
          ? eq(users.email, login)
          : eq(users.mobile, login)
      );
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    return await db.select().from(stores).where(eq(stores.isActive, true));
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, store: Partial<InsertStore>): Promise<Store> {
    const [updatedStore] = await db
      .update(stores)
      .set({ ...store, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return updatedStore;
  }

  async deleteStore(id: number): Promise<void> {
    await db.delete(stores).where(eq(stores.id, id));
  }

  async getUserStores(userId: string): Promise<Store[]> {
    const result = await db
      .select({ store: stores })
      .from(storeStaff)
      .innerJoin(stores, eq(storeStaff.storeId, stores.id))
      .where(eq(storeStaff.userId, userId));
    return result.map(r => r.store);
  }

  async getStoreStaff(storeId: number): Promise<(StoreStaff & { user: User })[]> {
    const result = await db
      .select()
      .from(storeStaff)
      .innerJoin(users, eq(storeStaff.userId, users.id))
      .where(eq(storeStaff.storeId, storeId));
    return result.map(r => ({ ...r.store_staff, user: r.users }));
  }

  async assignUserToStore(userId: string, storeId: number, role: string): Promise<StoreStaff> {
    const [assignment] = await db
      .insert(storeStaff)
      .values({ userId, storeId, role })
      .returning();
    return assignment;
  }

  // Customer operations
  async getCustomers(storeId?: number): Promise<(Customer & { membership?: CustomerMembership & { membershipPlan: MembershipPlan } })[]> {
    const baseQuery = db
      .select({
        customer: customers,
        membership: customerMemberships,
        membershipPlan: membershipPlans
      })
      .from(customers)
      .leftJoin(
        customerMemberships, 
        and(
          eq(customers.id, customerMemberships.customerId),
          eq(customerMemberships.isActive, true)
        )
      )
      .leftJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id));
    
    let results;
    if (storeId) {
      results = await baseQuery
        .where(eq(customers.storeId, storeId))
        .orderBy(desc(customers.createdAt));
    } else {
      results = await baseQuery.orderBy(desc(customers.createdAt));
    }
    
    return results.map(result => ({
      ...result.customer,
      membership: result.membership ? {
        ...result.membership,
        membershipPlan: result.membershipPlan
      } : undefined
    }));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByMobile(mobile: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.mobile, mobile));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Check for duplicate mobile number in the same store
    const existing = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.mobile, customer.mobile),
        eq(customers.storeId, customer.storeId)
      ));
    
    if (existing.length > 0) {
      throw new Error(`Customer with mobile number ${customer.mobile} already exists in this store`);
    }
    
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async updateCustomerLoyalty(id: number, points: number, visits: number, spent: string): Promise<void> {
    await db
      .update(customers)
      .set({
        loyaltyPoints: sql`${customers.loyaltyPoints} + ${points}`,
        totalVisits: sql`${customers.totalVisits} + ${visits}`,
        totalSpent: sql`${customers.totalSpent} + ${spent}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));
  }

  async getCustomerTransactions(customerId: number): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[]> {
    const transactionList = await db
      .select()
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .leftJoin(users, eq(transactions.staffId, users.id))
      .where(eq(transactions.customerId, customerId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    const result: (Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[] = [];

    for (const row of transactionList) {
      const transaction = row.transactions;
      const customer = row.customers;
      const staff = row.users;

      if (!staff) continue;

      const items = await db
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.transactionId, transaction.id));

      // Only include transactions that have actual items (actual bills)
      if (items.length > 0) {
        result.push({
          ...transaction,
          customer: customer || undefined,
          staff,
          items,
        });
      }
    }

    return result;
  }

  async getCustomersWithSpending(storeId: number): Promise<any[]> {
    try {
      // Get basic customers first
      const customerList = await db
        .select()
        .from(customers)
        .where(eq(customers.storeId, storeId))
        .orderBy(desc(customers.createdAt));

      // Calculate spending for each customer
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
      
      const customersWithSpending = await Promise.all(
        customerList.map(async (customer) => {
          try {
            // Get current year spending
            const currentYearQuery = await db
              .select({
                total: sql<string>`COALESCE(SUM(total_amount), '0')`
              })
              .from(transactions)
              .where(
                and(
                  eq(transactions.customerId, customer.id),
                  gte(transactions.createdAt, yearStart)
                )
              );

            // Get membership plan name
            const membershipQuery = await db
              .select({
                name: membershipPlans.name
              })
              .from(customerMemberships)
              .leftJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
              .where(
                and(
                  eq(customerMemberships.customerId, customer.id),
                  eq(customerMemberships.isActive, true)
                )
              )
              .limit(1);

            return {
              ...customer,
              currentYearSpending: currentYearQuery[0]?.total || '0',
              lifetimeSpending: customer.totalSpent || '0',
              membershipPlan: membershipQuery[0]?.name || null,
            };
          } catch (error) {
            console.error(`Error calculating spending for customer ${customer.id}:`, error);
            return {
              ...customer,
              currentYearSpending: '0',
              lifetimeSpending: customer.totalSpent || '0',
              membershipPlan: null,
            };
          }
        })
      );

      return customersWithSpending;
    } catch (error) {
      console.error('Error fetching customers with spending:', error);
      return [];
    }
  }

  async assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<void> {
    try {
      // First, deactivate any existing memberships for this customer
      await db
        .update(customerMemberships)
        .set({ isActive: false })
        .where(eq(customerMemberships.customerId, customerId));

      // Get membership plan details for expiry date calculation
      const membershipPlan = await this.getMembershipPlan(membershipPlanId);
      if (!membershipPlan) {
        throw new Error('Membership plan not found');
      }

      // Calculate expiry date
      const startDate = new Date().toISOString().split('T')[0];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (membershipPlan.validityDays || 365));
      const endDate = expiryDate.toISOString().split('T')[0];

      // Create new membership
      await db.insert(customerMemberships).values({
        customerId,
        membershipPlanId,
        startDate,
        endDate,
        isActive: true,
      });
    } catch (error) {
      console.error('Error assigning membership to customer:', error);
      throw error;
    }
  }

  // Product category operations
  async getProductCategories(storeId: number): Promise<ProductCategory[]> {
    return await db
      .select()
      .from(productCategories)
      .where(and(eq(productCategories.storeId, storeId), eq(productCategories.isActive, true)))
      .orderBy(productCategories.name);
  }

  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return category;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db.insert(productCategories).values(category).returning();
    return newCategory;
  }

  async updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory> {
    const [updatedCategory] = await db
      .update(productCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(productCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteProductCategory(id: number): Promise<void> {
    await db
      .update(productCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(productCategories.id, id));
  }

  // Service category operations
  async getServiceCategories(storeId: number): Promise<ServiceCategory[]> {
    return await db
      .select()
      .from(serviceCategories)
      .where(and(eq(serviceCategories.storeId, storeId), eq(serviceCategories.isActive, true)))
      .orderBy(serviceCategories.name);
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category;
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [newCategory] = await db.insert(serviceCategories).values(category).returning();
    return newCategory;
  }

  async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory> {
    const [updatedCategory] = await db
      .update(serviceCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteServiceCategory(id: number): Promise<void> {
    await db
      .update(serviceCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id));
  }

  // Service operations
  async getServices(storeId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.storeId, storeId), eq(services.isActive, true)))
      .orderBy(services.name);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Product operations
  async getProducts(storeId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
      .orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Generate barcode if not provided
    if (!product.barcode) {
      const timestamp = Date.now().toString();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      product.barcode = `${product.storeId}${timestamp.slice(-6)}${randomSuffix}`;
    }
    
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    // Ensure proper typing for update
    const updateData: any = { ...product, updatedAt: new Date() };
    
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async updateProductStock(id: number, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }

  async getLowStockProducts(storeId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.storeId, storeId),
          eq(products.isActive, true),
          sql`${products.stock} <= ${products.minStock}`
        )
      );
  }

  // Membership operations
  async getMembershipPlans(storeId: number): Promise<MembershipPlan[]> {
    return await db
      .select()
      .from(membershipPlans)
      .where(and(eq(membershipPlans.storeId, storeId), eq(membershipPlans.isActive, true)))
      .orderBy(membershipPlans.name);
  }

  async getMembershipPlan(id: number): Promise<MembershipPlan | undefined> {
    const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id));
    return plan;
  }

  async createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const [newPlan] = await db.insert(membershipPlans).values(plan).returning();
    return newPlan;
  }

  async updateMembershipPlan(id: number, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlan> {
    const [updatedPlan] = await db
      .update(membershipPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(membershipPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteMembershipPlan(id: number): Promise<void> {
    await db.delete(membershipPlans).where(eq(membershipPlans.id, id));
  }

  async getCustomerMembership(customerId: number): Promise<(CustomerMembership & { membershipPlan: MembershipPlan }) | undefined> {
    const [membership] = await db
      .select()
      .from(customerMemberships)
      .innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
      .where(
        and(
          eq(customerMemberships.customerId, customerId),
          eq(customerMemberships.isActive, true)
        )
      );
    
    if (!membership) return undefined;
    
    return {
      ...membership.customer_memberships,
      membershipPlan: membership.membership_plans,
    };
  }

  async createCustomerMembership(membership: Omit<CustomerMembership, "id" | "createdAt">): Promise<CustomerMembership> {
    const [newMembership] = await db.insert(customerMemberships).values(membership).returning();
    return newMembership;
  }

  // Transaction operations
  async getTransactions(storeId: number, limit = 50, startDate?: string, endDate?: string): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[]> {
    try {
      // Build where conditions
      let whereConditions = [eq(transactions.storeId, storeId)];
      
      if (startDate) {
        whereConditions.push(gte(transactions.createdAt, new Date(startDate + 'T00:00:00Z')));
      }
      
      if (endDate) {
        whereConditions.push(lte(transactions.createdAt, new Date(endDate + 'T23:59:59Z')));
      }

      // First get transactions only
      const transactionList = await db
        .select()
        .from(transactions)
        .where(and(...whereConditions))
        .orderBy(desc(transactions.createdAt))
        .limit(limit);

      if (transactionList.length === 0) {
        return [];
      }

      // Get related data for each transaction
      const result: (Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[] = [];
      for (const transaction of transactionList) {
        // Get customer if exists
        let customer: Customer | undefined = undefined;
        if (transaction.customerId) {
          const [customerRecord] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, transaction.customerId));
          customer = customerRecord;
        }

        // Get staff
        const [staff] = await db
          .select()
          .from(users)
          .where(eq(users.id, transaction.staffId));

        // Get transaction items
        const items = await db
          .select()
          .from(transactionItems)
          .where(eq(transactionItems.transactionId, transaction.id));

        if (staff) {
          result.push({
            ...transaction,
            customer,
            staff,
            items,
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getTransactions:', error);
      throw error;
    }
  }

  async getTransaction(id: number): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] }) | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .innerJoin(users, eq(transactions.staffId, users.id))
      .where(eq(transactions.id, id));

    if (!transaction) return undefined;

    const items = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, id));

    return {
      ...transaction.transactions,
      customer: transaction.customers || undefined,
      staff: transaction.users,
      items,
    };
  }

  async createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    const itemsWithTransactionId = items.map(item => ({
      ...item,
      transactionId: newTransaction.id,
    }));
    
    await db.insert(transactionItems).values(itemsWithTransactionId);
    
    return newTransaction;
  }

  async generateInvoiceNumber(storeId: number): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const prefix = `INV-${year}${month}${day}`;
    
    const [lastInvoice] = await db
      .select({ invoiceNumber: transactions.invoiceNumber })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          ilike(transactions.invoiceNumber, `${prefix}%`)
        )
      )
      .orderBy(desc(transactions.invoiceNumber))
      .limit(1);
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }
    
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  // Loyalty operations
  async getLoyaltySettings(storeId: number): Promise<LoyaltySettings | undefined> {
    const [settings] = await db
      .select()
      .from(loyaltySettings)
      .where(eq(loyaltySettings.storeId, storeId));
    return settings;
  }

  async updateLoyaltySettings(storeId: number, settings: Partial<LoyaltySettings>): Promise<LoyaltySettings> {
    const [updatedSettings] = await db
      .update(loyaltySettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(loyaltySettings.storeId, storeId))
      .returning();
    return updatedSettings;
  }

  // Dashboard stats
  async getDashboardStats(storeId: number): Promise<{
    todayRevenue: string;
    customersToday: number;
    servicesToday: number;
    activeMembers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [revenueResult] = await db
      .select({ revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, today),
          sql`${transactions.createdAt} < ${tomorrow}`
        )
      );

    const [customersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${transactions.customerId})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, today),
          sql`${transactions.createdAt} < ${tomorrow}`
        )
      );

    const [servicesResult] = await db
      .select({ count: sql<number>`COALESCE(SUM(${transactionItems.quantity}), 0)` })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.storeId, storeId),
          eq(transactionItems.itemType, 'service'),
          gte(transactions.createdAt, today),
          sql`${transactions.createdAt} < ${tomorrow}`
        )
      );

    const [membersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customerMemberships)
      .innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
      .where(
        and(
          eq(membershipPlans.storeId, storeId),
          eq(customerMemberships.isActive, true)
        )
      );

    return {
      todayRevenue: revenueResult.revenue || '0',
      customersToday: customersResult.count || 0,
      servicesToday: servicesResult.count || 0,
      activeMembers: membersResult.count || 0,
    };
  }

  // Reports
  async getSalesReport(storeId: number, startDate: Date, endDate: Date): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    totalDiscount: string;
    topServices: { name: string; count: number; revenue: string }[];
    topProducts: { name: string; count: number; revenue: string }[];
  }> {
    // Adjust end date to include the entire end day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const [revenueResult] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
        discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      );

    const topServices = await db
      .select({
        name: transactionItems.itemName,
        count: sql<number>`SUM(${transactionItems.quantity})`,
        revenue: sql<string>`SUM(${transactionItems.totalPrice})`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.storeId, storeId),
          eq(transactionItems.itemType, 'service'),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      )
      .groupBy(transactionItems.itemName)
      .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`))
      .limit(5);

    console.log("Top services query result:", topServices);

    const topProducts = await db
      .select({
        name: transactionItems.itemName,
        count: sql<number>`SUM(${transactionItems.quantity})`,
        revenue: sql<string>`SUM(${transactionItems.totalPrice})`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.storeId, storeId),
          eq(transactionItems.itemType, 'product'),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      )
      .groupBy(transactionItems.itemName)
      .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`))
      .limit(5);

    console.log("Top products query result:", topProducts);

    // If no results found in date range, get all-time data for this store
    if ((revenueResult.revenue === '0' || !revenueResult.revenue) && revenueResult.count === 0) {
      const [allTimeRevenue] = await db
        .select({
          revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
          count: sql<number>`COUNT(*)`,
          discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
        })
        .from(transactions)
        .where(eq(transactions.storeId, storeId));

      const allTimeServices = await db
        .select({
          name: transactionItems.itemName,
          count: sql<number>`SUM(${transactionItems.quantity})`,
          revenue: sql<string>`SUM(${transactionItems.totalPrice})`
        })
        .from(transactionItems)
        .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.storeId, storeId),
            eq(transactionItems.itemType, 'service')
          )
        )
        .groupBy(transactionItems.itemName)
        .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`))
        .limit(5);

      const allTimeProducts = await db
        .select({
          name: transactionItems.itemName,
          count: sql<number>`SUM(${transactionItems.quantity})`,
          revenue: sql<string>`SUM(${transactionItems.totalPrice})`
        })
        .from(transactionItems)
        .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.storeId, storeId),
            eq(transactionItems.itemType, 'product')
          )
        )
        .groupBy(transactionItems.itemName)
        .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`))
        .limit(5);

      return {
        totalRevenue: allTimeRevenue.revenue || '0',
        totalTransactions: allTimeRevenue.count || 0,
        totalDiscount: allTimeRevenue.discount || '0',
        topServices: allTimeServices.map(s => ({
          name: s.name,
          count: s.count || 0,
          revenue: s.revenue || '0'
        })),
        topProducts: allTimeProducts.map(p => ({
          name: p.name,
          count: p.count || 0,
          revenue: p.revenue || '0'
        })),
      };
    }

    return {
      totalRevenue: revenueResult.revenue || '0',
      totalTransactions: revenueResult.count || 0,
      totalDiscount: revenueResult.discount || '0',
      topServices: topServices.map(s => ({
        name: s.name,
        count: s.count || 0,
        revenue: s.revenue || '0'
      })),
      topProducts: topProducts.map(p => ({
        name: p.name,
        count: p.count || 0,
        revenue: p.revenue || '0'
      })),
    };
  }

  // Advanced analytics methods
  async getAdvancedAnalytics(storeId: number, startDate: Date, endDate: Date): Promise<{
    dailyAnalytics: { date: string; revenue: string; transactions: number; discount: string }[];
    weeklyComparison: { current: { revenue: string; transactions: number; discount: string }; previous: { revenue: string; transactions: number; discount: string }; change: { revenue: number; transactions: number; discount: number } };
    monthlyComparison: { current: { revenue: string; transactions: number; discount: string }; previous: { revenue: string; transactions: number; discount: string }; change: { revenue: number; transactions: number; discount: number } };
    productWiseReport: { name: string; quantity: number; revenue: string; discount: string }[];
    serviceWiseReport: { name: string; quantity: number; revenue: string; discount: string }[];
  }> {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    // Daily analytics
    const dailyAnalytics = await db
      .select({
        date: sql<string>`DATE(${transactions.createdAt})`,
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        transactions: sql<number>`COUNT(*)`,
        discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      )
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(sql`DATE(${transactions.createdAt})`);

    // Week-on-week comparison
    const currentWeekStart = new Date(endDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - 6);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    
    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const [currentWeekData] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        transactions: sql<number>`COUNT(*)`,
        discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, currentWeekStart),
          lte(transactions.createdAt, adjustedEndDate)
        )
      );

    const [previousWeekData] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        transactions: sql<number>`COUNT(*)`,
        discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, previousWeekStart),
          lte(transactions.createdAt, previousWeekEnd)
        )
      );

    // Month-on-month comparison
    const currentMonth = endDate.getMonth();
    const currentYear = endDate.getFullYear();
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthStart = new Date(previousYear, previousMonth, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const [currentMonthData] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        transactions: sql<number>`COUNT(*)`,
        discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, currentMonthStart),
          lte(transactions.createdAt, adjustedEndDate)
        )
      );

    const [previousMonthData] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        transactions: sql<number>`COUNT(*)`,
        discount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, previousMonthStart),
          lte(transactions.createdAt, previousMonthEnd)
        )
      );

    // Product-wise report with discount tracking
    const productWiseReport = await db
      .select({
        name: transactionItems.itemName,
        quantity: sql<number>`SUM(${transactionItems.quantity})`,
        revenue: sql<string>`SUM(${transactionItems.totalPrice})`,
        discount: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.discountAmount} > 0 THEN (${transactionItems.totalPrice} * ${transactions.discountAmount} / ${transactions.totalAmount}) ELSE 0 END), 0)`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.storeId, storeId),
          eq(transactionItems.itemType, 'product'),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      )
      .groupBy(transactionItems.itemName)
      .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`));

    // Service-wise report with discount tracking
    const serviceWiseReport = await db
      .select({
        name: transactionItems.itemName,
        quantity: sql<number>`SUM(${transactionItems.quantity})`,
        revenue: sql<string>`SUM(${transactionItems.totalPrice})`,
        discount: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.discountAmount} > 0 THEN (${transactionItems.totalPrice} * ${transactions.discountAmount} / ${transactions.totalAmount}) ELSE 0 END), 0)`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.storeId, storeId),
          eq(transactionItems.itemType, 'service'),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      )
      .groupBy(transactionItems.itemName)
      .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`));

    // Calculate percentage changes
    const calculateChange = (current: string, previous: string) => {
      const curr = parseFloat(current) || 0;
      const prev = parseFloat(previous) || 0;
      return prev === 0 ? 0 : ((curr - prev) / prev) * 100;
    };

    const calculateChangeNumber = (current: number, previous: number) => {
      return previous === 0 ? 0 : ((current - previous) / previous) * 100;
    };

    return {
      dailyAnalytics: dailyAnalytics.map(day => ({
        date: day.date,
        revenue: day.revenue || '0',
        transactions: day.transactions || 0,
        discount: day.discount || '0'
      })),
      weeklyComparison: {
        current: {
          revenue: currentWeekData?.revenue || '0',
          transactions: currentWeekData?.transactions || 0,
          discount: currentWeekData?.discount || '0'
        },
        previous: {
          revenue: previousWeekData?.revenue || '0',
          transactions: previousWeekData?.transactions || 0,
          discount: previousWeekData?.discount || '0'
        },
        change: {
          revenue: calculateChange(currentWeekData?.revenue || '0', previousWeekData?.revenue || '0'),
          transactions: calculateChangeNumber(currentWeekData?.transactions || 0, previousWeekData?.transactions || 0),
          discount: calculateChange(currentWeekData?.discount || '0', previousWeekData?.discount || '0')
        }
      },
      monthlyComparison: {
        current: {
          revenue: currentMonthData?.revenue || '0',
          transactions: currentMonthData?.transactions || 0,
          discount: currentMonthData?.discount || '0'
        },
        previous: {
          revenue: previousMonthData?.revenue || '0',
          transactions: previousMonthData?.transactions || 0,
          discount: previousMonthData?.discount || '0'
        },
        change: {
          revenue: calculateChange(currentMonthData?.revenue || '0', previousMonthData?.revenue || '0'),
          transactions: calculateChangeNumber(currentMonthData?.transactions || 0, previousMonthData?.transactions || 0),
          discount: calculateChange(currentMonthData?.discount || '0', previousMonthData?.discount || '0')
        }
      },
      productWiseReport: productWiseReport.map(p => ({
        name: p.name,
        quantity: p.quantity || 0,
        revenue: p.revenue || '0',
        discount: p.discount || '0'
      })),
      serviceWiseReport: serviceWiseReport.map(s => ({
        name: s.name,
        quantity: s.quantity || 0,
        revenue: s.revenue || '0',
        discount: s.discount || '0'
      }))
    };
  }

  // WhatsApp operations
  async getWhatsappSettings(storeId: number): Promise<WhatsappSettings | undefined> {
    const [settings] = await db
      .select()
      .from(whatsappSettings)
      .where(eq(whatsappSettings.storeId, storeId));
    return settings;
  }

  async updateWhatsappSettings(storeId: number, settingsData: Partial<InsertWhatsappSettings>): Promise<WhatsappSettings> {
    try {
      console.log('updateWhatsappSettings called with:', { storeId, settingsData });
      const existing = await this.getWhatsappSettings(storeId);
      console.log('Existing WhatsApp settings:', existing);
      
      if (existing) {
        console.log('Updating existing WhatsApp settings...');
        const [updated] = await db
          .update(whatsappSettings)
          .set({ ...settingsData, updatedAt: new Date() })
          .where(eq(whatsappSettings.storeId, storeId))
          .returning();
        console.log('WhatsApp settings updated:', updated);
        return updated;
      } else {
        console.log('Creating new WhatsApp settings...');
        const [created] = await db
          .insert(whatsappSettings)
          .values({ ...settingsData, storeId })
          .returning();
        console.log('WhatsApp settings created:', created);
        return created;
      }
    } catch (error) {
      console.error('Error in updateWhatsappSettings:', error);
      throw error;
    }
  }

  async getWhatsappTemplates(storeId: number): Promise<WhatsappTemplate[]> {
    return await db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.storeId, storeId))
      .orderBy(desc(whatsappTemplates.createdAt));
  }

  async getWhatsappTemplate(id: number): Promise<WhatsappTemplate | undefined> {
    const [template] = await db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.id, id));
    return template;
  }

  async createWhatsappTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate> {
    try {
      console.log('createWhatsappTemplate called with:', template);
      const [created] = await db
        .insert(whatsappTemplates)
        .values(template)
        .returning();
      console.log('WhatsApp template created in database:', created);
      return created;
    } catch (error) {
      console.error('Error in createWhatsappTemplate:', error);
      throw error;
    }
  }

  async updateWhatsappTemplate(id: number, template: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate> {
    const [updated] = await db
      .update(whatsappTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(whatsappTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteWhatsappTemplate(id: number): Promise<void> {
    await db
      .delete(whatsappTemplates)
      .where(eq(whatsappTemplates.id, id));
  }

  async getWhatsappMessages(storeId: number, limit = 100): Promise<WhatsappMessage[]> {
    try {
      console.log('getWhatsappMessages called with:', { storeId, limit });
      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.storeId, storeId))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(limit);
      console.log('WhatsApp messages fetched from database:', messages.length, 'messages');
      return messages;
    } catch (error) {
      console.error('Error in getWhatsappMessages:', error);
      throw error;
    }
  }

  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [created] = await db
      .insert(whatsappMessages)
      .values(message)
      .returning();
    return created;
  }

  async updateWhatsappMessageStatus(id: number, status: string, whatsappMessageId?: string, errorMessage?: string): Promise<void> {
    await db
      .update(whatsappMessages)
      .set({
        status,
        whatsappMessageId,
        errorMessage,
        sentAt: status === 'sent' ? new Date() : undefined
      })
      .where(eq(whatsappMessages.id, id));
  }

  async getBirthdayCustomers(storeId: number, date: Date): Promise<Customer[]> {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.storeId, storeId),
          sql`EXTRACT(MONTH FROM ${customers.dateOfBirth}) = ${month}`,
          sql`EXTRACT(DAY FROM ${customers.dateOfBirth}) = ${day}`
        )
      );
  }

  async getAnniversaryCustomers(storeId: number, date: Date): Promise<Customer[]> {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.storeId, storeId),
          sql`EXTRACT(MONTH FROM ${customers.anniversaryDate}) = ${month}`,
          sql`EXTRACT(DAY FROM ${customers.anniversaryDate}) = ${day}`
        )
      );
  }

  async getCustomerCampaigns(storeId: number): Promise<CustomerCampaign[]> {
    return await db
      .select()
      .from(customerCampaigns)
      .where(eq(customerCampaigns.storeId, storeId))
      .orderBy(desc(customerCampaigns.createdAt));
  }

  async createCustomerCampaign(campaign: InsertCustomerCampaign): Promise<CustomerCampaign> {
    const [created] = await db
      .insert(customerCampaigns)
      .values(campaign)
      .returning();
    return created;
  }

  async updateCustomerCampaign(id: number, campaign: Partial<InsertCustomerCampaign>): Promise<CustomerCampaign> {
    const [updated] = await db
      .update(customerCampaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(customerCampaigns.id, id))
      .returning();
    return updated;
  }

  // Login page settings operations
  async getLoginPageSettings(): Promise<LoginPageSettings | undefined> {
    const [settings] = await db.select().from(loginPageSettings).limit(1);
    return settings;
  }

  async updateLoginPageSettings(settings: Partial<InsertLoginPageSettings>): Promise<LoginPageSettings> {
    // First try to update existing settings
    const existing = await this.getLoginPageSettings();
    
    if (existing) {
      const [updated] = await db
        .update(loginPageSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(loginPageSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings if none exist
      const [created] = await db
        .insert(loginPageSettings)
        .values({ ...settings, updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async getDailySalesReport(storeId: number, date: Date): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    totalDiscount: string;
    cashCollection: string;
    upiCollection: string;
    cardCollection: string;
    paymentBreakdown: { method: string; amount: string; count: number }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get overall daily stats
    const [dailyStats] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        totalTransactions: sql<number>`COUNT(*)`,
        totalDiscount: sql<string>`COALESCE(SUM(${transactions.discountAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, startOfDay),
          lte(transactions.createdAt, endOfDay)
        )
      );

    // Get payment method breakdown
    const paymentBreakdown = await db
      .select({
        method: transactions.paymentMethod,
        amount: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, startOfDay),
          lte(transactions.createdAt, endOfDay)
        )
      )
      .groupBy(transactions.paymentMethod);

    // Calculate individual payment method totals
    const cashCollection = paymentBreakdown.find(p => p.method === 'cash')?.amount || '0';
    const upiCollection = paymentBreakdown.find(p => p.method === 'upi')?.amount || '0';
    const cardCollection = paymentBreakdown.find(p => p.method === 'card')?.amount || '0';

    return {
      totalRevenue: dailyStats.totalRevenue || '0',
      totalTransactions: dailyStats.totalTransactions || 0,
      totalDiscount: dailyStats.totalDiscount || '0',
      cashCollection,
      upiCollection,
      cardCollection,
      paymentBreakdown: paymentBreakdown.map(p => ({
        method: p.method || 'cash',
        amount: p.amount || '0',
        count: p.count || 0
      }))
    };
  }

  async getStaffPerformanceReport(storeId: number, startDate: Date, endDate: Date): Promise<{
    staffId: string;
    staffName: string;
    totalServices: number;
    totalRevenue: string;
    avgServiceValue: string;
    serviceBreakdown: { serviceName: string; count: number; revenue: string }[];
  }[]> {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    // Get staff performance data
    const staffPerformance = await db
      .select({
        staffId: transactionItems.serviceStaffId,
        staffName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        totalServices: sql<number>`COUNT(*)`,
        totalRevenue: sql<string>`SUM(${transactionItems.totalPrice})`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(users, eq(transactionItems.serviceStaffId, users.id))
      .where(
        and(
          eq(transactions.storeId, storeId),
          eq(transactionItems.itemType, 'service'),
          isNotNull(transactionItems.serviceStaffId),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, adjustedEndDate)
        )
      )
      .groupBy(transactionItems.serviceStaffId, users.firstName, users.lastName);

    // Get service breakdown for each staff member
    const result = [];
    for (const staff of staffPerformance) {
      if (!staff.staffId) continue;
      
      const serviceBreakdown = await db
        .select({
          serviceName: transactionItems.itemName,
          count: sql<number>`COUNT(*)`,
          revenue: sql<string>`SUM(${transactionItems.totalPrice})`
        })
        .from(transactionItems)
        .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.storeId, storeId),
            eq(transactionItems.itemType, 'service'),
            eq(transactionItems.serviceStaffId, staff.staffId),
            gte(transactions.createdAt, startDate),
            lte(transactions.createdAt, adjustedEndDate)
          )
        )
        .groupBy(transactionItems.itemName)
        .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`));

      const avgServiceValue = staff.totalServices > 0 
        ? (parseFloat(staff.totalRevenue) / staff.totalServices).toFixed(2)
        : '0';

      result.push({
        staffId: staff.staffId,
        staffName: staff.staffName,
        totalServices: staff.totalServices,
        totalRevenue: staff.totalRevenue,
        avgServiceValue,
        serviceBreakdown: serviceBreakdown.map(s => ({
          serviceName: s.serviceName,
          count: s.count,
          revenue: s.revenue
        }))
      });
    }

    return result;
  }

  // Appointment operations
  async getAppointments(storeId: number, date?: Date): Promise<Appointment[]> {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      return db.select().from(appointments)
        .where(
          and(
            eq(appointments.storeId, storeId),
            eq(appointments.appointmentDate, dateStr)
          )
        )
        .orderBy(appointments.appointmentDate, appointments.appointmentTime);
    }
    
    return db.select().from(appointments)
      .where(eq(appointments.storeId, storeId))
      .orderBy(appointments.appointmentDate, appointments.appointmentTime);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getAvailableTimeSlots(storeId: number, date: Date): Promise<string[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    // Get appointment settings for the store
    const settings = await this.getAppointmentSettings(storeId);
    if (!settings) {
      // Return default hourly slots if no settings configured
      return this.generateDefaultTimeSlots();
    }
    
    // Get existing appointments for the date with appointment count per time slot
    const existingAppointments = await db
      .select({ 
        appointmentTime: appointments.appointmentTime,
        count: sql<number>`count(*)::int`
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.storeId, storeId),
          eq(appointments.appointmentDate, dateStr),
          sql`${appointments.status} != 'cancelled'`
        )
      )
      .groupBy(appointments.appointmentTime);
    
    // Generate time slots based on store settings
    const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number): string[] => {
      const slots: string[] = [];
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
        currentMinutes += slotDuration;
      }
      
      return slots;
    };
    
    // Generate all possible slots based on settings
    const allSlots = generateTimeSlots(
      settings.openingTime, 
      settings.closingTime, 
      settings.slotDuration
    );
    
    // Filter out slots that have reached maximum concurrent appointments
    const appointmentCounts = new Map(
      existingAppointments.map(apt => [apt.appointmentTime, apt.count])
    );
    
    return allSlots.filter(slot => {
      const currentCount = appointmentCounts.get(slot) || 0;
      return currentCount < settings.maxConcurrentAppointments;
    });
  }

  private generateDefaultTimeSlots(): string[] {
    const slots: string[] = [];
    // Generate hourly slots from 9 AM to 6 PM
    for (let hour = 9; hour <= 18; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    return slots;
  }

  // Appointment settings operations
  async getAppointmentSettings(storeId: number): Promise<AppointmentSettings | undefined> {
    const [settings] = await db
      .select()
      .from(appointmentSettings)
      .where(eq(appointmentSettings.storeId, storeId));
    return settings;
  }

  async createAppointmentSettings(settings: InsertAppointmentSettings): Promise<AppointmentSettings> {
    const [newSettings] = await db
      .insert(appointmentSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateAppointmentSettings(storeId: number, settings: Partial<AppointmentSettings>): Promise<AppointmentSettings> {
    const [updatedSettings] = await db
      .update(appointmentSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(appointmentSettings.storeId, storeId))
      .returning();
    return updatedSettings;
  }

  async getCustomerSpending(customerId: number): Promise<{
    currentYearSpending: string;
    lifetimeSpending: string;
  }> {
    const customer = await this.getCustomer(customerId);
    if (!customer) {
      return { currentYearSpending: "0", lifetimeSpending: "0" };
    }

    const currentYearStart = new Date();
    currentYearStart.setMonth(3, 1); // April 1st
    currentYearStart.setHours(0, 0, 0, 0);
    if (currentYearStart > new Date()) {
      currentYearStart.setFullYear(currentYearStart.getFullYear() - 1);
    }

    const [result] = await db
      .select({
        currentYearSpending: sql<string>`
          COALESCE(
            (SELECT SUM(total_amount) 
             FROM transactions 
             WHERE customer_id = ${customerId} 
             AND created_at >= ${currentYearStart}
            ), 0
          )
        `
      })
      .from(transactions)
      .limit(1);

    return {
      currentYearSpending: result?.currentYearSpending || "0",
      lifetimeSpending: customer.totalSpent
    };
  }

  async exportCustomersToExcel(customers: any[]): Promise<Buffer> {
    const XLSX = await import('xlsx');
    
    const worksheetData = customers.map(customer => ({
      'First Name': customer.firstName,
      'Last Name': customer.lastName || '',
      'Mobile': customer.mobile,
      'Email': customer.email || '',
      'Date of Birth': customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '',
      'Gender': customer.gender || '',
      'Address': customer.address || '',
      'Loyalty Points': customer.loyaltyPoints,
      'Total Visits': customer.totalVisits,
      'Current Year Spending': `Rs. ${customer.currentYearSpending}`,
      'Lifetime Spending': `Rs. ${customer.lifetimeSpending}`,
      'Membership Plan': customer.membershipPlan || 'None',
      'Created Date': new Date(customer.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }



  // Appointment Staff operations
  async getAppointmentStaff(appointmentId: number): Promise<AppointmentStaff[]> {
    return await db
      .select()
      .from(appointmentStaff)
      .where(eq(appointmentStaff.appointmentId, appointmentId));
  }

  async assignStaffToAppointment(appointmentId: number, staffId: string): Promise<AppointmentStaff> {
    const [assignment] = await db
      .insert(appointmentStaff)
      .values({ appointmentId, staffId })
      .returning();
    return assignment;
  }

  async removeStaffFromAppointment(appointmentId: number, staffId: string): Promise<void> {
    await db
      .delete(appointmentStaff)
      .where(
        and(
          eq(appointmentStaff.appointmentId, appointmentId),
          eq(appointmentStaff.staffId, staffId)
        )
      );
  }

  // SMS Settings operations
  async getSmsSettings(storeId: number): Promise<SmsSettings | undefined> {
    const [settings] = await db
      .select()
      .from(smsSettings)
      .where(eq(smsSettings.storeId, storeId));
    return settings;
  }

  async createSmsSettings(settings: InsertSmsSettings): Promise<SmsSettings> {
    const [newSettings] = await db
      .insert(smsSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateSmsSettings(storeId: number, settings: Partial<SmsSettings>): Promise<SmsSettings> {
    const [updatedSettings] = await db
      .update(smsSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(smsSettings.storeId, storeId))
      .returning();
    return updatedSettings;
  }

  // Email Settings operations
  async getEmailSettings(storeId: number): Promise<EmailSettings | undefined> {
    const [settings] = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.storeId, storeId));
    return settings;
  }

  async createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const [newSettings] = await db
      .insert(emailSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateEmailSettings(storeId: number, settings: Partial<EmailSettings>): Promise<EmailSettings> {
    const [updatedSettings] = await db
      .update(emailSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(emailSettings.storeId, storeId))
      .returning();
    return updatedSettings;
  }

  // Communication Templates operations
  async getCommunicationTemplates(storeId: number): Promise<CommunicationTemplate[]> {
    return await db
      .select()
      .from(communicationTemplates)
      .where(eq(communicationTemplates.storeId, storeId))
      .orderBy(desc(communicationTemplates.createdAt));
  }

  async getCommunicationTemplate(storeId: number, type: string, category: string): Promise<CommunicationTemplate | undefined> {
    const [template] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.storeId, storeId),
          eq(communicationTemplates.type, type),
          eq(communicationTemplates.category, category),
          eq(communicationTemplates.isActive, true)
        )
      );
    return template;
  }

  async createCommunicationTemplate(template: InsertCommunicationTemplate): Promise<CommunicationTemplate> {
    const [newTemplate] = await db
      .insert(communicationTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateCommunicationTemplate(id: number, template: Partial<CommunicationTemplate>): Promise<CommunicationTemplate> {
    const [updatedTemplate] = await db
      .update(communicationTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(communicationTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteCommunicationTemplate(id: number): Promise<void> {
    await db.delete(communicationTemplates).where(eq(communicationTemplates.id, id));
  }

  // Communication Messages operations
  async getCommunicationMessages(storeId: number): Promise<CommunicationMessage[]> {
    return await db
      .select()
      .from(communicationMessages)
      .where(eq(communicationMessages.storeId, storeId))
      .orderBy(desc(communicationMessages.createdAt));
  }

  async createCommunicationMessage(message: InsertCommunicationMessage): Promise<CommunicationMessage> {
    const [newMessage] = await db
      .insert(communicationMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Customer Communication Preferences operations
  async getCustomerCommunicationPreferences(customerId: number): Promise<CustomerCommunicationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(customerCommunicationPreferences)
      .where(eq(customerCommunicationPreferences.customerId, customerId));
    return preferences;
  }

  async createCustomerCommunicationPreferences(preferences: InsertCustomerCommunicationPreferences): Promise<CustomerCommunicationPreferences> {
    const [newPreferences] = await db
      .insert(customerCommunicationPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }

  async updateCustomerCommunicationPreferences(customerId: number, preferences: Partial<CustomerCommunicationPreferences>): Promise<CustomerCommunicationPreferences> {
    const [updatedPreferences] = await db
      .update(customerCommunicationPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(customerCommunicationPreferences.customerId, customerId))
      .returning();
    return updatedPreferences;
  }

  // WhatsApp template helper
  async getWhatsappTemplate(storeId: number, type: string): Promise<WhatsappTemplate | undefined> {
    const [template] = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.storeId, storeId),
          eq(whatsappTemplates.type, type),
          eq(whatsappTemplates.isActive, true)
        )
      );
    return template;
  }

  // Enhanced WhatsApp message status update
  async updateWhatsappMessageStatus(messageId: number, status: string, providerId?: string, error?: string): Promise<void> {
    await db
      .update(whatsappMessages)
      .set({
        status,
        whatsappMessageId: providerId,
        errorMessage: error,
        sentAt: status === 'sent' ? new Date() : undefined
      })
      .where(eq(whatsappMessages.id, messageId));
  }

  // Staff Performance Analytics
  async getStaffPerformance(storeId: number, startDate?: string, endDate?: string): Promise<any[]> {
    let dateFilters = [];
    if (startDate) {
      dateFilters.push(gte(transactions.createdAt, new Date(startDate)));
    }
    if (endDate) {
      dateFilters.push(lte(transactions.createdAt, new Date(endDate)));
    }

    const staffPerformanceData = await db
      .select({
        staffId: users.id,
        staffName: users.email,
        staffEmail: users.email,
        role: storeStaff.role,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${transactions.totalAmount} AS DECIMAL)), 0)`,
        servicesCompleted: sql<number>`COUNT(DISTINCT ${transactions.id})`
      })
      .from(storeStaff)
      .innerJoin(users, eq(storeStaff.userId, users.id))
      .leftJoin(transactions, and(
        eq(transactions.staffId, users.id),
        eq(transactions.storeId, storeId),
        ...dateFilters
      ))
      .where(eq(storeStaff.storeId, storeId))
      .groupBy(users.id, users.email, storeStaff.role);

    return staffPerformanceData;
  }

  async getMembershipReport(storeId: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Membership sales in the period (from transaction items)
      const membershipSales = await db
        .select({
          planName: transactionItems.itemName,
          quantity: sql<number>`SUM(${transactionItems.quantity})`,
          revenue: sql<string>`SUM(${transactionItems.totalPrice})`,
          averagePrice: sql<string>`AVG(${transactionItems.unitPrice})`
        })
        .from(transactionItems)
        .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.storeId, storeId),
            eq(transactionItems.itemType, 'membership'),
            gte(transactions.createdAt, start),
            lte(transactions.createdAt, end)
          )
        )
        .groupBy(transactionItems.itemName)
        .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`));

      // Active memberships count by plan
      const activeMemberships = await db
        .select({
          planName: membershipPlans.name,
          planId: membershipPlans.id,
          activeCount: sql<number>`COUNT(${customerMemberships.id})`,
          totalRevenue: sql<string>`SUM(${membershipPlans.price})`
        })
        .from(customerMemberships)
        .innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
        .innerJoin(customers, eq(customerMemberships.customerId, customers.id))
        .where(
          and(
            eq(customers.storeId, storeId),
            eq(customerMemberships.isActive, true)
          )
        )
        .groupBy(membershipPlans.id, membershipPlans.name)
        .orderBy(desc(sql`COUNT(${customerMemberships.id})`));

      // Monthly membership assignments
      const monthlyAssignments = await db
        .select({
          month: sql<string>`DATE_TRUNC('month', ${customerMemberships.startDate})`,
          count: sql<number>`COUNT(*)`,
          revenue: sql<string>`SUM(${membershipPlans.price})`
        })
        .from(customerMemberships)
        .innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
        .innerJoin(customers, eq(customerMemberships.customerId, customers.id))
        .where(
          and(
            eq(customers.storeId, storeId),
            gte(sql`${customerMemberships.startDate}`, start.toISOString().split('T')[0]),
            lte(sql`${customerMemberships.startDate}`, end.toISOString().split('T')[0])
          )
        )
        .groupBy(sql`DATE_TRUNC('month', ${customerMemberships.startDate})`)
        .orderBy(sql`DATE_TRUNC('month', ${customerMemberships.startDate})`);

      // Summary stats
      const [summaryStats] = await db
        .select({
          totalActiveMemberships: sql<number>`COUNT(DISTINCT ${customerMemberships.id})`,
          totalPlans: sql<number>`COUNT(DISTINCT ${membershipPlans.id})`,
          totalMembershipRevenue: sql<string>`COALESCE(SUM(${membershipPlans.price}), 0)`
        })
        .from(membershipPlans)
        .leftJoin(customerMemberships, and(
          eq(customerMemberships.membershipPlanId, membershipPlans.id),
          eq(customerMemberships.isActive, true)
        ))
        .leftJoin(customers, eq(customerMemberships.customerId, customers.id))
        .where(eq(membershipPlans.storeId, storeId));

      return {
        summary: {
          totalActiveMemberships: summaryStats?.totalActiveMemberships || 0,
          totalPlans: summaryStats?.totalPlans || 0,
          totalMembershipRevenue: summaryStats?.totalMembershipRevenue || '0'
        },
        membershipSales: membershipSales.map(sale => ({
          planName: sale.planName,
          quantitySold: sale.quantity,
          revenue: sale.revenue,
          averagePrice: sale.averagePrice
        })),
        activeMemberships: activeMemberships.map(membership => ({
          planName: membership.planName,
          planId: membership.planId,
          activeCount: membership.activeCount,
          totalValue: membership.totalRevenue
        })),
        monthlyTrends: monthlyAssignments.map(month => ({
          month: month.month,
          assignmentsCount: month.count,
          revenue: month.revenue
        }))
      };
    } catch (error) {
      console.error('Error generating membership report:', error);
      return {
        summary: { totalActiveMemberships: 0, totalPlans: 0, totalMembershipRevenue: '0' },
        membershipSales: [],
        activeMemberships: [],
        monthlyTrends: []
      };
    }
  }
}

// Export PostgreSQL storage
export const storage = new DatabaseStorage();
