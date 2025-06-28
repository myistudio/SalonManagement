import {
  users,
  stores,
  storeStaff,
  customers,
  services,
  products,
  membershipPlans,
  customerMemberships,
  transactions,
  transactionItems,
  loyaltySettings,
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
  type MembershipPlan,
  type InsertMembershipPlan,
  type CustomerMembership,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
  type LoyaltySettings,
  type StoreStaff,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (for basic email/password auth)
  getUser(id: string): Promise<User | undefined>;
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
  getCustomers(storeId?: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByMobile(mobile: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  updateCustomerLoyalty(id: number, points: number, visits: number, spent: string): Promise<void>;

  // Service operations
  getServices(storeId: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

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
    topServices: { name: string; count: number; revenue: string }[];
    topProducts: { name: string; count: number; revenue: string }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
  async getCustomers(storeId?: number): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt));
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
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
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
  async getTransactions(storeId: number, limit = 50): Promise<(Transaction & { customer?: Customer; staff: User; items: TransactionItem[] })[]> {
    try {
      // First get transactions only
      const transactionList = await db
        .select()
        .from(transactions)
        .where(eq(transactions.storeId, storeId))
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
    topServices: { name: string; count: number; revenue: string }[];
    topProducts: { name: string; count: number; revenue: string }[];
  }> {
    // Adjust end date to include the entire end day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const [revenueResult] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`
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
          count: sql<number>`COUNT(*)`
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
}

export const storage = new DatabaseStorage();
