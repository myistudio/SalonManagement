import { eq, desc, asc, and, or, gte, lte, inArray, sql, like } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  stores,
  storeStaff,
  customers,
  services,
  serviceCategories,
  products,
  productCategories,
  membershipPlans,
  customerMemberships,
  transactions,
  transactionItems,
  loginPageSettings,
  type User,
  type UpsertUser,
  type Store,
  type InsertStore,
  type Customer,
  type InsertCustomer,
  type Service,
  type InsertService,
  type ServiceCategory,
  type InsertServiceCategory,
  type Product,
  type InsertProduct,
  type ProductCategory,
  type InsertProductCategory,
  type MembershipPlan,
  type InsertMembershipPlan,
  type CustomerMembership,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
  type StoreStaff,
  type LoginPageSettings,
  type InsertLoginPageSettings
} from "@shared/schema";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByEmailOrMobile(login: string): Promise<User | undefined>;
  createUser(userData: UpsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;

  // Store operations
  getStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(id: number): Promise<void>;
  getUserStores(userId: string): Promise<Store[]>;

  // Customer operations
  getCustomers(storeId: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  searchCustomers(storeId: number, query: string): Promise<Customer[]>;
  getCustomerWithMembership(id: number): Promise<{ customer: Customer; membership?: MembershipPlan } | undefined>;

  // Service operations
  getServices(storeId: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Service category operations
  getServiceCategories(storeId: number): Promise<ServiceCategory[]>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory>;
  deleteServiceCategory(id: number): Promise<void>;

  // Product operations
  getProducts(storeId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Product category operations
  getProductCategories(storeId: number): Promise<ProductCategory[]>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory>;
  deleteProductCategory(id: number): Promise<void>;

  // Membership operations
  getMembershipPlans(storeId: number): Promise<MembershipPlan[]>;
  getMembershipPlan(id: number): Promise<MembershipPlan | undefined>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan>;
  updateMembershipPlan(id: number, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlan>;
  deleteMembershipPlan(id: number): Promise<void>;
  assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<CustomerMembership>;

  // Transaction operations
  getTransactions(storeId: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  generateInvoiceNumber(storeId: number): Promise<string>;
  createTransaction(transaction: InsertTransaction, items?: any[]): Promise<Transaction>;
  createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  getCustomerMembership(customerId: number): Promise<{ membershipPlan?: MembershipPlan } | undefined>;
  updateCustomerLoyalty(customerId: number, pointsEarned: number, totalAmount: number): Promise<void>;
  updateProductStock(productId: number, quantitySold: number): Promise<void>;

  // Login settings
  getLoginPageSettings(): Promise<LoginPageSettings | undefined>;
  updateLoginPageSettings(settings: Partial<InsertLoginPageSettings>): Promise<LoginPageSettings>;
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
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          login.includes('@') 
            ? eq(users.email, login)
            : eq(users.mobile, login)
        );
      return user;
    } catch (error) {
      console.error('Error fetching user by email/mobile:', error);
      return undefined;
    }
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
      .returning();
    return user;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    try {
      return await db.select().from(stores).where(eq(stores.isActive, true));
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
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
      .set({ ...store, updatedAt: new Date().toISOString() })
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

  // Customer operations
  async getCustomers(storeId: number): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.storeId, storeId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date().toISOString() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async searchCustomers(storeId: number, query: string): Promise<Customer[]> {
    return await db
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
  }

  async getCustomerWithMembership(id: number): Promise<{ customer: Customer; membership?: MembershipPlan } | undefined> {
    const [result] = await db
      .select({
        customer: customers,
        membershipPlan: membershipPlans
      })
      .from(customers)
      .leftJoin(customerMemberships, and(
        eq(customerMemberships.customerId, customers.id),
        eq(customerMemberships.isActive, true)
      ))
      .leftJoin(membershipPlans, eq(membershipPlans.id, customerMemberships.membershipPlanId))
      .where(eq(customers.id, id));

    if (!result) return undefined;

    return {
      customer: result.customer,
      membership: result.membershipPlan || undefined
    };
  }

  // Service operations
  async getServices(storeId: number): Promise<Service[]> {
    const results = await db
      .select({
        id: services.id,
        storeId: services.storeId,
        name: services.name,
        description: services.description,
        price: services.price,
        duration: services.duration,
        categoryId: services.categoryId,
        category: serviceCategories.name,
        imageUrl: services.imageUrl,
        isActive: services.isActive,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt
      })
      .from(services)
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.storeId, storeId), eq(services.isActive, true)))
      .orderBy(asc(services.name));
    
    return results as any[];
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date().toISOString() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Service category operations
  async getServiceCategories(storeId: number): Promise<ServiceCategory[]> {
    return await db
      .select()
      .from(serviceCategories)
      .where(and(eq(serviceCategories.storeId, storeId), eq(serviceCategories.isActive, true)))
      .orderBy(asc(serviceCategories.name));
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [newCategory] = await db
      .insert(serviceCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory> {
    const [updatedCategory] = await db
      .update(serviceCategories)
      .set({ ...category, updatedAt: new Date().toISOString() })
      .where(eq(serviceCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteServiceCategory(id: number): Promise<void> {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
  }

  // Product operations
  async getProducts(storeId: number): Promise<Product[]> {
    const results = await db
      .select({
        id: products.id,
        storeId: products.storeId,
        name: products.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        barcode: products.barcode,
        categoryId: products.categoryId,
        category: productCategories.name,
        brand: products.brand,
        stock: products.stock,
        minStock: products.minStock,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
      .orderBy(asc(products.name));
    
    return results as any[];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.barcode, barcode));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date().toISOString() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Product category operations
  async getProductCategories(storeId: number): Promise<ProductCategory[]> {
    return await db
      .select()
      .from(productCategories)
      .where(and(eq(productCategories.storeId, storeId), eq(productCategories.isActive, true)))
      .orderBy(asc(productCategories.name));
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db
      .insert(productCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory> {
    const [updatedCategory] = await db
      .update(productCategories)
      .set({ ...category, updatedAt: new Date().toISOString() })
      .where(eq(productCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteProductCategory(id: number): Promise<void> {
    await db.delete(productCategories).where(eq(productCategories.id, id));
  }

  // Membership operations
  async getMembershipPlans(storeId: number): Promise<MembershipPlan[]> {
    return await db
      .select()
      .from(membershipPlans)
      .where(and(eq(membershipPlans.storeId, storeId), eq(membershipPlans.isActive, true)))
      .orderBy(asc(membershipPlans.name));
  }

  async getMembershipPlan(id: number): Promise<MembershipPlan | undefined> {
    const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id));
    return plan;
  }

  async createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const [newPlan] = await db
      .insert(membershipPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateMembershipPlan(id: number, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlan> {
    const [updatedPlan] = await db
      .update(membershipPlans)
      .set({ ...plan, updatedAt: new Date().toISOString() })
      .where(eq(membershipPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteMembershipPlan(id: number): Promise<void> {
    // First, remove any customer memberships with this plan
    await db.delete(customerMemberships).where(eq(customerMemberships.membershipPlanId, id));
    
    // Then delete the membership plan
    await db.delete(membershipPlans).where(eq(membershipPlans.id, id));
  }

  async assignMembershipToCustomer(customerId: number, membershipPlanId: number): Promise<CustomerMembership> {
    const [membership] = await db
      .insert(customerMemberships)
      .values({
        customerId,
        membershipPlanId,
        startDate: new Date().toISOString(),
        isActive: true
      })
      .returning();
    return membership;
  }

  // Transaction operations
  async getTransactions(storeId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.storeId, storeId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async generateInvoiceNumber(storeId: number): Promise<string> {
    try {
      // Use a simple timestamp-based approach to avoid schema issues
      const timestamp = Date.now().toString().slice(-6);
      return `ST${storeId}-${timestamp}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to basic number
      const fallback = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      return `ST${storeId}-${fallback}`;
    }
  }

  async createTransaction(transaction: InsertTransaction, items?: any[]): Promise<Transaction> {
    try {
      // Create basic transaction data that matches the actual database schema
      const basicTransactionData = {
        storeId: transaction.storeId,
        customerId: transaction.customerId || null,
        invoiceNumber: transaction.invoiceNumber,
        subtotal: transaction.subtotal,
        discountAmount: transaction.discountAmount || 0,
        taxAmount: transaction.taxAmount || 0,
        totalAmount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod || 'Cash',
        staffId: transaction.staffId || null,
        pointsEarned: transaction.pointsEarned || 0,
        pointsRedeemed: transaction.pointsRedeemed || 0,
        membershipDiscount: transaction.membershipDiscount || 0
      };
      
      // Create the transaction first using raw SQL to avoid schema issues
      const result = await db.run(sql`
        INSERT INTO transactions (
          store_id, customer_id, invoice_number, subtotal, discount_amount, 
          tax_amount, total_amount, payment_method, staff_id, points_earned, 
          points_redeemed, membership_discount, created_at
        ) VALUES (
          ${basicTransactionData.storeId}, ${basicTransactionData.customerId}, 
          ${basicTransactionData.invoiceNumber}, ${basicTransactionData.subtotal}, 
          ${basicTransactionData.discountAmount}, ${basicTransactionData.taxAmount}, 
          ${basicTransactionData.totalAmount}, ${basicTransactionData.paymentMethod}, 
          ${basicTransactionData.staffId}, ${basicTransactionData.pointsEarned}, 
          ${basicTransactionData.pointsRedeemed}, ${basicTransactionData.membershipDiscount}, 
          datetime('now')
        )
      `);

      const transactionId = result.lastInsertRowid as number;

      // Create transaction items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await db.run(sql`
            INSERT INTO transaction_items (
              transaction_id, item_type, item_id, item_name, quantity, 
              unit_price, total_price, service_staff_id, membership_plan_id, created_at
            ) VALUES (
              ${transactionId}, ${item.itemType}, ${item.itemId}, 
              ${item.itemName}, ${item.quantity}, ${item.unitPrice}, 
              ${item.totalPrice}, ${item.serviceStaffId}, ${item.membershipPlanId}, 
              datetime('now')
            )
          `);
        }
      }

      // Return a basic transaction object
      return {
        id: transactionId,
        storeId: basicTransactionData.storeId,
        customerId: basicTransactionData.customerId,
        invoiceNumber: basicTransactionData.invoiceNumber,
        subtotal: basicTransactionData.subtotal,
        discountAmount: basicTransactionData.discountAmount,
        taxAmount: basicTransactionData.taxAmount,
        totalAmount: basicTransactionData.totalAmount,
        paymentMethod: basicTransactionData.paymentMethod,
        staffId: basicTransactionData.staffId,
        pointsEarned: basicTransactionData.pointsEarned,
        pointsRedeemed: basicTransactionData.pointsRedeemed,
        membershipDiscount: basicTransactionData.membershipDiscount,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        isActive: true,
        notes: null
      } as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem> {
    const [newItem] = await db
      .insert(transactionItems)
      .values(item)
      .returning();
    return newItem;
  }

  async getCustomerMembership(customerId: number): Promise<{ membershipPlan?: MembershipPlan } | undefined> {
    try {
      const [result] = await db
        .select({
          membershipPlan: membershipPlans
        })
        .from(customerMemberships)
        .leftJoin(membershipPlans, eq(membershipPlans.id, customerMemberships.membershipPlanId))
        .where(and(
          eq(customerMemberships.customerId, customerId),
          eq(customerMemberships.isActive, true)
        ));

      return result ? { membershipPlan: result.membershipPlan || undefined } : undefined;
    } catch (error) {
      console.error('Error getting customer membership:', error);
      return undefined;
    }
  }

  async updateCustomerLoyalty(customerId: number, pointsEarned: number, totalAmount: number): Promise<void> {
    try {
      // Get current customer data
      const customer = await this.getCustomer(customerId);
      if (!customer) return;

      // Update customer loyalty points and stats
      await db
        .update(customers)
        .set({
          loyaltyPoints: (customer.loyaltyPoints || 0) + pointsEarned,
          totalVisits: (customer.totalVisits || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + totalAmount
        })
        .where(eq(customers.id, customerId));
    } catch (error) {
      console.error('Error updating customer loyalty:', error);
      throw error;
    }
  }

  async updateProductStock(productId: number, quantitySold: number): Promise<void> {
    try {
      const product = await this.getProduct(productId);
      if (!product) return;

      const newStock = Math.max(0, (product.stock || 0) - quantitySold);
      
      await db
        .update(products)
        .set({
          stock: newStock
        })
        .where(eq(products.id, productId));
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }

  // Login settings
  async getLoginPageSettings(): Promise<LoginPageSettings | undefined> {
    try {
      const [settings] = await db.select().from(loginPageSettings).limit(1);
      return settings;
    } catch (error) {
      console.log('Login settings table not found, returning defaults');
      return {
        id: 1,
        companyName: 'SalonPro',
        logoUrl: null,
        primaryColor: '#8B5CF6',
        secondaryColor: '#EC4899',
        welcomeMessage: 'Welcome to our Salon Management System',
        footerText: 'Designed by - My Internet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  async updateLoginPageSettings(settings: Partial<InsertLoginPageSettings>): Promise<LoginPageSettings> {
    // First try to update existing settings
    const existing = await this.getLoginPageSettings();
    
    if (existing) {
      const [updated] = await db
        .update(loginPageSettings)
        .set({ ...settings, updatedAt: new Date().toISOString() })
        .where(eq(loginPageSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings if none exist
      const [created] = await db
        .insert(loginPageSettings)
        .values({ ...settings, updatedAt: new Date().toISOString() })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();