import bcrypt from 'bcrypt';
import { eq, and, or, desc, asc, sql, like } from "drizzle-orm";
import { db } from './db-sqlite';
import {
  users,
  stores,
  storeStaff,
  customers,
  membershipPlans,
  customerMemberships,
  services,
  products,
  transactions,
  loginPageSettings,
  serviceCategories,
  productCategories,
  type User,
  type UpsertUser,
  type Store,
  type InsertStore,
  type Customer,
  type InsertCustomer,
  type MembershipPlan,
  type InsertMembershipPlan,
  type CustomerMembership,
  type InsertCustomerMembership,
  type Service,
  type InsertService,
  type Product,
  type InsertProduct,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema-sqlite";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByEmailOrMobile(login: string): Promise<User | undefined>;
  createUser(userData: UpsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;

  // Store operations
  getStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(storeData: InsertStore): Promise<Store>;
  updateStore(id: number, storeData: Partial<InsertStore>): Promise<Store>;

  // Customer operations
  getCustomers(storeId: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customerData: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer>;

  // Membership operations
  getMembershipPlans(storeId: number): Promise<MembershipPlan[]>;
  getMembershipPlan(id: number): Promise<MembershipPlan | undefined>;
  createMembershipPlan(planData: InsertMembershipPlan): Promise<MembershipPlan>;

  // Service operations
  getServices(storeId: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(serviceData: InsertService): Promise<Service>;

  // Product operations
  getProducts(storeId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(productData: InsertProduct): Promise<Product>;

  // Transaction operations
  createTransaction(transactionData: InsertTransaction): Promise<Transaction>;
  getTransactions(storeId: number): Promise<Transaction[]>;

  // Login page settings
  getLoginPageSettings(): Promise<any>;

  // Additional methods needed by the application
  generateInvoiceNumber(): Promise<string>;
  searchCustomers(storeId: number, query: string): Promise<Customer[]>;
  getUserStores(userId: string): Promise<Store[]>;
  deleteStore(id: number): Promise<void>;
  getStoreStaff(storeId: number): Promise<any[]>;
  createStoreStaff(data: any): Promise<any>;
  updateStoreStaff(id: number, data: any): Promise<any>;
  deleteStoreStaff(id: number): Promise<void>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  deleteCustomer(id: number): Promise<void>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  updateMembershipPlan(id: number, data: Partial<InsertMembershipPlan>): Promise<MembershipPlan>;
  deleteMembershipPlan(id: number): Promise<void>;
  assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<CustomerMembership>;
  getServiceCategories(storeId: number): Promise<any[]>;
  createServiceCategory(data: any): Promise<any>;
  updateServiceCategory(id: number, data: any): Promise<any>;
  deleteServiceCategory(id: number): Promise<void>;
  getProductCategories(storeId: number): Promise<any[]>;
  createProductCategory(data: any): Promise<any>;
  updateProductCategory(id: number, data: any): Promise<any>;
  deleteProductCategory(id: number): Promise<void>;
  getCustomerWithMembership(id: number): Promise<any>;
  getCustomerMembership(customerId: number): Promise<any>;
  getDashboardStats(storeId: number): Promise<any>;
  getLowStockProducts(storeId: number): Promise<Product[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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
    const now = Date.now();
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = Date.now();
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: now,
        },
      })
      .returning();
    return user;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const now = Date.now();
    const [store] = await db
      .insert(stores)
      .values({
        ...storeData,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return store;
  }

  async updateStore(id: number, storeData: Partial<InsertStore>): Promise<Store> {
    const now = Date.now();
    const [store] = await db
      .update(stores)
      .set({
        ...storeData,
        updatedAt: now,
      })
      .where(eq(stores.id, id))
      .returning();
    return store;
  }

  // Customer operations
  async getCustomers(storeId: number): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.storeId, storeId));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const now = Date.now();
    const [customer] = await db
      .insert(customers)
      .values({
        ...customerData,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const now = Date.now();
    const [customer] = await db
      .update(customers)
      .set({
        ...customerData,
        updatedAt: now,
      })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  // Membership operations
  async getMembershipPlans(storeId: number): Promise<MembershipPlan[]> {
    return await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.storeId, storeId));
  }

  async getMembershipPlan(id: number): Promise<MembershipPlan | undefined> {
    const [plan] = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, id));
    return plan;
  }

  async createMembershipPlan(planData: InsertMembershipPlan): Promise<MembershipPlan> {
    const now = Date.now();
    const [plan] = await db
      .insert(membershipPlans)
      .values({
        ...planData,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return plan;
  }

  // Service operations
  async getServices(storeId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.storeId, storeId));
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const now = Date.now();
    const [service] = await db
      .insert(services)
      .values({
        ...serviceData,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return service;
  }

  // Product operations
  async getProducts(storeId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.storeId, storeId));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const now = Date.now();
    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return product;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const now = Date.now();
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...transactionData,
        createdAt: now,
      })
      .returning();
    return transaction;
  }

  async getTransactions(storeId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.storeId, storeId))
      .orderBy(desc(transactions.createdAt));
  }

  // Login page settings
  async getLoginPageSettings(): Promise<any> {
    const [settings] = await db
      .select()
      .from(loginPageSettings)
      .limit(1);
    return settings || {
      companyName: 'SalonPro',
      welcomeMessage: 'Welcome to SalonPro',
      tagline: 'Professional Salon Management',
    };
  }

  // Additional methods implementation
  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    return `INV-${year}${month}-${timestamp}`;
  }

  async searchCustomers(storeId: number, query: string): Promise<Customer[]> {
    const customers = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.storeId, storeId),
          or(
            like(customers.firstName, `%${query}%`),
            like(customers.lastName, `%${query}%`),
            like(customers.mobile, `%${query}%`),
            like(customers.email, `%${query}%`)
          )
        )
      );
    return customers;
  }

  async getUserStores(userId: string): Promise<Store[]> {
    const userStoreIds = await db
      .select({ storeId: storeStaff.storeId })
      .from(storeStaff)
      .where(eq(storeStaff.userId, userId));
    
    if (userStoreIds.length === 0) return [];
    
    const storeIds = userStoreIds.map(s => s.storeId);
    const userStores = await db
      .select()
      .from(stores)
      .where(sql`${stores.id} IN (${storeIds.join(',')})`);
    
    return userStores;
  }

  async deleteStore(id: number): Promise<void> {
    await db.delete(stores).where(eq(stores.id, id));
  }

  async getStoreStaff(storeId: number): Promise<any[]> {
    const staff = await db
      .select({
        id: storeStaff.id,
        userId: storeStaff.userId,
        role: storeStaff.role,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        mobile: users.mobile,
      })
      .from(storeStaff)
      .leftJoin(users, eq(storeStaff.userId, users.id))
      .where(eq(storeStaff.storeId, storeId));
    
    return staff;
  }

  async createStoreStaff(data: any): Promise<any> {
    const now = Date.now();
    const [staffMember] = await db
      .insert(storeStaff)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return staffMember;
  }

  async updateStoreStaff(id: number, data: any): Promise<any> {
    const now = Date.now();
    const [staffMember] = await db
      .update(storeStaff)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(storeStaff.id, id))
      .returning();
    return staffMember;
  }

  async deleteStoreStaff(id: number): Promise<void> {
    await db.delete(storeStaff).where(eq(storeStaff.id, id));
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product> {
    const now = Date.now();
    const [product] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateService(id: number, data: Partial<InsertService>): Promise<Service> {
    const now = Date.now();
    const [service] = await db
      .update(services)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.barcode, barcode));
    return product;
  }

  async updateMembershipPlan(id: number, data: Partial<InsertMembershipPlan>): Promise<MembershipPlan> {
    const now = Date.now();
    const [plan] = await db
      .update(membershipPlans)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(membershipPlans.id, id))
      .returning();
    return plan;
  }

  async deleteMembershipPlan(id: number): Promise<void> {
    await db.delete(membershipPlans).where(eq(membershipPlans.id, id));
  }

  async assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<CustomerMembership> {
    const now = Date.now();
    const [membership] = await db
      .insert(customerMemberships)
      .values({
        customerId,
        membershipPlanId,
        startDate: new Date().toISOString().split('T')[0],
        isActive: true,
        createdAt: now,
      })
      .returning();
    return membership;
  }

  async getServiceCategories(storeId: number): Promise<any[]> {
    return await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.storeId, storeId));
  }

  async createServiceCategory(data: any): Promise<any> {
    const now = Date.now();
    const [category] = await db
      .insert(serviceCategories)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return category;
  }

  async updateServiceCategory(id: number, data: any): Promise<any> {
    const now = Date.now();
    const [category] = await db
      .update(serviceCategories)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(serviceCategories.id, id))
      .returning();
    return category;
  }

  async deleteServiceCategory(id: number): Promise<void> {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
  }

  async getProductCategories(storeId: number): Promise<any[]> {
    return await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.storeId, storeId));
  }

  async createProductCategory(data: any): Promise<any> {
    const now = Date.now();
    const [category] = await db
      .insert(productCategories)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return category;
  }

  async updateProductCategory(id: number, data: any): Promise<any> {
    const now = Date.now();
    const [category] = await db
      .update(productCategories)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(productCategories.id, id))
      .returning();
    return category;
  }

  async deleteProductCategory(id: number): Promise<void> {
    await db.delete(productCategories).where(eq(productCategories.id, id));
  }

  async getCustomerWithMembership(id: number): Promise<any> {
    const [customer] = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        mobile: customers.mobile,
        email: customers.email,
        loyaltyPoints: customers.loyaltyPoints,
        membershipId: customerMemberships.id,
        membershipPlanId: customerMemberships.membershipPlanId,
        membershipName: membershipPlans.name,
        discountPercentage: membershipPlans.discountPercentage,
        pointsMultiplier: membershipPlans.pointsMultiplier,
      })
      .from(customers)
      .leftJoin(customerMemberships, and(
        eq(customerMemberships.customerId, customers.id),
        eq(customerMemberships.isActive, true)
      ))
      .leftJoin(membershipPlans, eq(membershipPlans.id, customerMemberships.membershipPlanId))
      .where(eq(customers.id, id));
    
    return customer;
  }

  async getCustomerByMobile(mobile: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.mobile, mobile));
    return customer;
  }

  async getCustomerMembership(customerId: number): Promise<any> {
    const [membership] = await db
      .select({
        id: customerMemberships.id,
        membershipPlanId: customerMemberships.membershipPlanId,
        startDate: customerMemberships.startDate,
        endDate: customerMemberships.endDate,
        isActive: customerMemberships.isActive,
        membershipName: membershipPlans.name,
        discountPercentage: membershipPlans.discountPercentage,
        pointsMultiplier: membershipPlans.pointsMultiplier,
      })
      .from(customerMemberships)
      .leftJoin(membershipPlans, eq(membershipPlans.id, customerMemberships.membershipPlanId))
      .where(and(
        eq(customerMemberships.customerId, customerId),
        eq(customerMemberships.isActive, true)
      ));
    
    return membership;
  }

  async getDashboardStats(storeId: number): Promise<any> {
    // Get total customers
    const totalCustomers = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.storeId, storeId));

    // Get total products
    const totalProducts = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.storeId, storeId));

    // Get total services
    const totalServices = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(eq(services.storeId, storeId));

    // Get recent transactions (last 30 days)
    const recentTransactions = await db
      .select({ total: sql<number>`sum(${transactions.totalAmount})` })
      .from(transactions)
      .where(and(
        eq(transactions.storeId, storeId),
        sql`${transactions.createdAt} >= datetime('now', '-30 days')`
      ));

    return {
      totalCustomers: totalCustomers[0]?.count || 0,
      totalProducts: totalProducts[0]?.count || 0,
      totalServices: totalServices[0]?.count || 0,
      monthlyRevenue: recentTransactions[0]?.total || 0,
      activeAppointments: 0 // placeholder for now
    };
  }

  async getLowStockProducts(storeId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        sql`${products.stock} <= ${products.minStock}`
      ));
  }
}

export const storage = new DatabaseStorage();