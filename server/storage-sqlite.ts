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
}

export const storage = new DatabaseStorage();