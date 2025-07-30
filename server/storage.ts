import { eq, desc, asc, and, or, gte, lte, inArray, sql, like } from "drizzle-orm";
import { db } from "./db";
import { getISTDateString, getISTDateTime } from "./utils/timezone";
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
  appointments,
  appointmentSettings,
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
  getTransactions(storeId: number, limit?: number, startDate?: string, endDate?: string): Promise<Transaction[]>;
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

  // Staff operations
  getStoreStaff(storeId: number): Promise<StoreStaff[]>;
  
  // Appointment operations
  getAppointments(storeId?: number): Promise<any[]>;
}

// Switch from SQLite to PostgreSQL
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
      .set({ ...customer, updatedAt: new Date() })
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
      .set({ ...product, updatedAt: new Date() })
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
      .set({ ...category, updatedAt: new Date() })
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
      .set({ ...plan, updatedAt: new Date() })
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
    try {
      // Get membership plan to calculate end date
      const plan = await this.getMembershipPlan(membershipPlanId);
      if (!plan) {
        throw new Error('Membership plan not found');
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (plan.durationMonths || 12)); // Default to 12 months if not specified

      console.log(`Assigning membership: customerId=${customerId}, planId=${membershipPlanId}, duration=${plan.durationMonths} months`);

      const [membership] = await db
        .insert(customerMemberships)
        .values({
          customerId,
          membershipPlanId,
          startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          isActive: true
        })
        .returning();
      
      console.log('Membership assigned successfully:', membership);
      return membership;
    } catch (error) {
      console.error('Error assigning membership:', error);
      throw error;
    }
  }

  // Transaction operations
  async getTransactions(storeId: number, limit?: number, startDate?: string, endDate?: string): Promise<Transaction[]> {
    console.log(`DatabaseStorage.getTransactions called for store: ${storeId}, limit: ${limit}`);
    
    // First get transactions
    let baseQuery = db
      .select()
      .from(transactions)
      .where(eq(transactions.storeId, storeId))
      .orderBy(desc(transactions.createdAt));

    if (limit) {
      baseQuery = baseQuery.limit(limit);
    }

    const transactionResults = await baseQuery;
    console.log(`Found ${transactionResults.length} transactions for store ${storeId}`);

    // Get customer details separately for each transaction
    const transactionsWithCustomers = await Promise.all(
      transactionResults.map(async (transaction) => {
        if (transaction.customerId) {
          const [customer] = await db
            .select({
              id: customers.id,
              firstName: customers.firstName,
              lastName: customers.lastName,
              mobile: customers.mobile,
              email: customers.email
            })
            .from(customers)
            .where(eq(customers.id, transaction.customerId));
          
          return {
            ...transaction,
            customer: customer || null
          };
        }
        return {
          ...transaction,
          customer: null
        };
      })
    );

    return transactionsWithCustomers as any[];
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
      // Create the transaction using proper Drizzle ORM
      const [newTransaction] = await db
        .insert(transactions)
        .values({
          storeId: transaction.storeId,
          customerId: transaction.customerId || null,
          invoiceNumber: transaction.invoiceNumber,
          subtotal: transaction.subtotal,
          discountAmount: transaction.discountAmount || 0,
          taxAmount: transaction.taxAmount || 0,
          totalAmount: transaction.totalAmount,
          paymentMethod: transaction.paymentMethod || 'cash',
          staffId: transaction.staffId || null,
          pointsEarned: transaction.pointsEarned || 0,
          pointsRedeemed: transaction.pointsRedeemed || 0,
          membershipDiscount: transaction.membershipDiscount || 0
        })
        .returning();

      // Create transaction items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await db
            .insert(transactionItems)
            .values({
              transactionId: newTransaction.id,
              itemType: item.itemType,
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              serviceStaffId: item.serviceStaffId || null,
              membershipPlanId: item.membershipPlanId || null
            });
        }
      }

      return newTransaction;
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

  // Staff operations - simplified to avoid Drizzle ORM JOIN issues
  async getStoreStaff(storeId: number): Promise<StoreStaff[]> {
    try {
      // First get store staff records
      const staffRecords = await db
        .select()
        .from(storeStaff)
        .where(eq(storeStaff.storeId, storeId));
      
      if (staffRecords.length === 0) {
        return [];
      }
      
      // Get user IDs
      const userIds = staffRecords.map(staff => staff.userId);
      
      // Get user details separately
      const userDetails = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));
      
      // Combine staff records with user details in expected format
      return staffRecords.map(staff => {
        const user = userDetails.find(u => u.id === staff.userId);
        return {
          id: staff.id,
          storeId: staff.storeId,
          userId: staff.userId,
          role: staff.role,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
          user: {
            id: user?.id || staff.userId,
            email: user?.email || '',
            mobile: user?.mobile || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            role: user?.role || staff.role
          }
        };
      });
    } catch (error) {
      console.error('Error fetching store staff:', error);
      // Return empty array to prevent complete failure
      return [];
    }
  }

  // Appointments operations
  async getAppointments(storeId?: number): Promise<any[]> {
    try {
      const appointmentsQuery = storeId 
        ? db.select().from(appointments).where(eq(appointments.storeId, storeId))
        : db.select().from(appointments);
      
      return await appointmentsQuery;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  async createAppointment(appointment: any): Promise<any> {
    try {
      console.log('=== CREATE APPOINTMENT: Input data:', appointment);
      
      // Remove timestamps and let PostgreSQL handle them automatically
      const appointmentData = {
        storeId: appointment.storeId,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customerEmail || null,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        services: appointment.services,
        status: appointment.status || 'pending',
        notes: appointment.notes || null
      };

      console.log('=== CREATE APPOINTMENT: Processed data:', appointmentData);

      const [created] = await db
        .insert(appointments)
        .values(appointmentData)
        .returning();

      console.log('=== CREATE APPOINTMENT: Success:', created);
      return created;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: number, updates: any): Promise<any> {
    try {
      console.log('=== UPDATE APPOINTMENT: ID:', id, 'Updates:', updates);
      
      // Let PostgreSQL handle updatedAt automatically
      const updateData = { ...updates };
      delete updateData.updatedAt; // Remove to let PostgreSQL default handle it

      const [updated] = await db
        .update(appointments)
        .set(updateData)
        .where(eq(appointments.id, id))
        .returning();

      console.log('=== UPDATE APPOINTMENT: Success:', updated);
      return updated;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<boolean> {
    try {
      await db
        .delete(appointments)
        .where(eq(appointments.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  // Appointment Settings operations
  async getAppointmentSettings(storeId: number): Promise<any> {
    try {
      const [settings] = await db
        .select()
        .from(appointmentSettings)
        .where(eq(appointmentSettings.storeId, storeId));

      if (!settings) {
        // Return default settings
        return {
          storeId,
          openingTime: '09:00',
          closingTime: '18:00', 
          slotDuration: 30,
          maxConcurrentAppointments: 3,
          workingHours: '09:00-18:00'
        };
      }

      return {
        ...settings,
        workingHours: `${settings.openingTime}-${settings.closingTime}`
      };
    } catch (error) {
      console.error('Error fetching appointment settings:', error);
      return {
        storeId,
        openingTime: '09:00',
        closingTime: '18:00',
        slotDuration: 30,
        maxConcurrentAppointments: 3,
        workingHours: '09:00-18:00'
      };
    }
  }

  async updateAppointmentSettings(storeId: number, settings: any): Promise<any> {
    try {
      const settingsData = {
        ...settings,
        storeId
      };

      // Try to update existing settings
      const existing = await db
        .select()
        .from(appointmentSettings)
        .where(eq(appointmentSettings.storeId, storeId));

      if (existing.length > 0) {
        const [updated] = await db
          .update(appointmentSettings)
          .set(settingsData)
          .where(eq(appointmentSettings.storeId, storeId))
          .returning();
        return updated;
      } else {
        // Create new settings
        const [created] = await db
          .insert(appointmentSettings)
          .values(settingsData)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error updating appointment settings:', error);
      throw error;
    }
  }

  async getTimeSlots(storeId: number, date: string): Promise<string[]> {
    try {
      const settings = await this.getAppointmentSettings(storeId);
      const { openingTime, closingTime, slotDuration } = settings;

      if (!openingTime || !closingTime || !slotDuration) {
        return [];
      }

      const slots: string[] = [];
      const start = new Date(`2000-01-01T${openingTime}:00`);
      const end = new Date(`2000-01-01T${closingTime}:00`);
      
      let current = new Date(start);
      
      while (current < end) {
        slots.push(current.toTimeString().slice(0, 5));
        current.setMinutes(current.getMinutes() + slotDuration);
      }

      return slots;
    } catch (error) {
      console.error('Error generating time slots:', error);
      return [];
    }
  }

  async getAvailableTimeSlots(storeId: number, date: Date): Promise<string[]> {
    try {
      console.log(`Getting time slots for store ${storeId} on ${date}`);
      const settings = await this.getAppointmentSettings(storeId);
      console.log('Appointment settings fetched:', settings);
      
      const { openingTime, closingTime, slotDuration } = settings;

      if (!openingTime || !closingTime || !slotDuration) {
        console.log('Missing appointment settings for store', storeId, { openingTime, closingTime, slotDuration });
        return [];
      }

      const slots: string[] = [];
      const start = new Date(`2000-01-01T${openingTime}:00`);
      const end = new Date(`2000-01-01T${closingTime}:00`);
      
      let current = new Date(start);
      
      while (current < end) {
        slots.push(current.toTimeString().slice(0, 5));
        current.setMinutes(current.getMinutes() + slotDuration);
      }

      console.log(`Generated ${slots.length} time slots for store ${storeId}:`, slots.slice(0, 5));
      return slots;
    } catch (error) {
      console.error('Error generating available time slots:', error);
      return [];
    }
  }

  // Dashboard operations
  async getDashboardStats(storeId: number): Promise<any> {
    try {
      console.log(`=== DASHBOARD STATS: Fetching for store ${storeId}`);
      
      // Get basic counts with store filtering
      const customerCount = await db.select().from(customers).where(eq(customers.storeId, storeId));
      const productCount = await db.select().from(products).where(eq(products.storeId, storeId));
      const serviceCount = await db.select().from(services).where(eq(services.storeId, storeId));
      
      // Get today's transactions using real-time date functions
      const todayTransactions = await db.select().from(transactions)
        .where(and(
          eq(transactions.storeId, storeId),
          sql`DATE(${transactions.createdAt}) = CURRENT_DATE`
        ));
      
      console.log(`=== DASHBOARD STATS: Found ${todayTransactions.length} today transactions for store ${storeId}`);
      
      // Get yesterday's transactions for comparison
      const yesterdayTransactions = await db.select().from(transactions)
        .where(and(
          eq(transactions.storeId, storeId),
          sql`DATE(${transactions.createdAt}) = CURRENT_DATE - INTERVAL '1 day'`
        ));
      
      // Calculate revenue
      const todaysRevenue = todayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const yesterdaysRevenue = yesterdayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      
      // Calculate revenue change percentage
      const revenueChange = yesterdaysRevenue > 0 
        ? ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue * 100).toFixed(1)
        : todaysRevenue > 0 ? "100" : "0";
      
      // Get unique customers served today
      const uniqueCustomerIds = new Set();
      todayTransactions.forEach(t => {
        if (t.customerId) uniqueCustomerIds.add(t.customerId);
      });
      const customersToday = uniqueCustomerIds.size;
      
      // Get today's customers created
      const newCustomersToday = await db.select().from(customers)
        .where(and(
          eq(customers.storeId, storeId),
          sql`DATE(${customers.createdAt}) = CURRENT_DATE`
        ));
      
      // Count services from today's transactions
      let servicesToday = 0;
      try {
        for (const transaction of todayTransactions) {
          const items = await db.select().from(transactionItems)
            .where(eq(transactionItems.transactionId, transaction.id));
          servicesToday += items.filter(item => item.itemType === 'service').length;
        }
      } catch (error) {
        console.error('Error counting services:', error);
      }
      
      // Get active memberships for store customers
      let activeMemberships = [];
      try {
        console.log(`=== DASHBOARD STATS: Fetching active memberships for store ${storeId}`);
        const storeCustomers = await db.select().from(customers).where(eq(customers.storeId, storeId));
        console.log(`=== DASHBOARD STATS: Found ${storeCustomers.length} customers in store ${storeId}`);
        
        const customerIds = storeCustomers.map(c => c.id);
        
        if (customerIds.length > 0) {
          activeMemberships = await db.select().from(customerMemberships)
            .where(and(
              inArray(customerMemberships.customerId, customerIds),
              sql`${customerMemberships.endDate} > CURRENT_DATE OR ${customerMemberships.endDate} IS NULL`
            ));
          console.log(`=== DASHBOARD STATS: Found ${activeMemberships.length} active memberships for store ${storeId}`);
        }
      } catch (error) {
        console.error('Error getting active memberships:', error);
      }
      
      return {
        customers: customerCount.length,
        products: productCount.length,
        services: serviceCount.length,
        todaysRevenue,
        yesterdaysRevenue,
        revenueChange: parseFloat(revenueChange),
        todaysTransactions: todayTransactions.length,
        customersToday,
        newCustomersToday: newCustomersToday.length,
        servicesToday,
        activeMembers: activeMemberships.length
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        customers: 0,
        products: 0,
        services: 0,
        todaysRevenue: 0,
        yesterdaysRevenue: 0,
        revenueChange: 0,
        todaysTransactions: 0,
        customersToday: 0,
        newCustomersToday: 0,
        servicesToday: 0,
        activeMembers: 0
      };
    }
  }

  // Reports operations
  async getSalesReport(storeId: number, startDate: Date, endDate: Date): Promise<any> {
    try {
      const start = `${startDate.toISOString().split('T')[0]} 00:00:00`;
      const end = `${endDate.toISOString().split('T')[0]} 23:59:59`;
      
      console.log(`Getting sales report for store ${storeId} from ${start} to ${end}`);
      
      const salesData = await db.select().from(transactions)
        .where(and(
          eq(transactions.storeId, storeId),
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end)
        ));
      
      console.log(`Found ${salesData.length} transactions for sales report`);
      
      const totalRevenue = salesData.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const totalTransactions = salesData.length;
      
      return {
        totalRevenue,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        transactions: salesData
      };
    } catch (error) {
      console.error('Error getting sales report:', error);
      return { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0, transactions: [] };
    }
  }

  async getAdvancedAnalytics(storeId: number, startDate: Date, endDate: Date): Promise<any> {
    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      return {
        salesTrend: [],
        topProducts: [],
        topServices: [],
        customerAnalytics: {},
        revenueByPaymentMethod: {}
      };
    } catch (error) {
      console.error('Error getting advanced analytics:', error);
      return {};
    }
  }

  async getDailySalesReport(storeId: number, date: Date): Promise<any> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // Use today's date
      
      console.log(`Getting daily sales for store ${storeId} on ${dateStr}`);
      
      // Use SQL function to filter by date
      const dailySales = await db.select().from(transactions)
        .where(and(
          eq(transactions.storeId, storeId),
          sql`DATE(${transactions.createdAt}) = ${dateStr}`
        ));
      
      console.log(`Found ${dailySales.length} transactions for daily report`);
      
      return {
        date: dateStr,
        totalRevenue: dailySales.reduce((sum, t) => sum + (t.totalAmount || 0), 0),
        totalTransactions: dailySales.length,
        transactions: dailySales
      };
    } catch (error) {
      console.error('Error getting daily sales report:', error);
      return { date: '', totalRevenue: 0, totalTransactions: 0, transactions: [] };
    }
  }

  async getStaffPerformanceReport(storeId: number, startDate: Date, endDate: Date): Promise<any> {
    try {
      return { staffPerformance: [] };
    } catch (error) {
      console.error('Error getting staff performance report:', error);
      return { staffPerformance: [] };
    }
  }

  // Transaction items operations
  async getTransactionItems(transactionId: number): Promise<any[]> {
    try {
      console.log(`=== STORAGE: Getting transaction items for transaction ${transactionId}`);
      
      const items = await db.select({
        id: transactionItems.id,
        transactionId: transactionItems.transactionId,
        itemType: transactionItems.itemType,
        itemId: transactionItems.itemId,
        itemName: transactionItems.itemName,
        quantity: transactionItems.quantity,
        unitPrice: transactionItems.unitPrice,
        totalPrice: transactionItems.totalPrice,
      }).from(transactionItems)
        .where(eq(transactionItems.transactionId, transactionId))
        .orderBy(transactionItems.id);
      
      console.log(`=== STORAGE: Found ${items.length} items for transaction ${transactionId}`);
      return items;
    } catch (error) {
      console.error('Error getting transaction items:', error);
      return [];
    }
  }

  async getMembershipReport(storeId: number): Promise<any> {
    try {
      const memberships = await db.select().from(customerMemberships)
        .leftJoin(customers, eq(customerMemberships.customerId, customers.id))
        .leftJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
        .where(eq(customers.storeId, storeId));
      
      return { memberships };
    } catch (error) {
      console.error('Error getting membership report:', error);
      return { memberships: [] };
    }
  }

  // Customer operations
  async getCustomerByMobile(mobile: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.mobile, mobile));
    return customer || undefined;
  }

  async getCustomerTransactions(customerId: number): Promise<any[]> {
    try {
      const customerTransactions = await db.select().from(transactions)
        .where(eq(transactions.customerId, customerId))
        .orderBy(desc(transactions.createdAt));
      return customerTransactions;
    } catch (error) {
      console.error('Error getting customer transactions:', error);
      return [];
    }
  }

  async getCustomersWithSpending(storeId: number): Promise<any[]> {
    try {
      const customersData = await db.select().from(customers)
        .where(eq(customers.storeId, storeId));
      return customersData;
    } catch (error) {
      console.error('Error getting customers with spending:', error);
      return [];
    }
  }

  // Transaction Items operations
  async getTransactionItems(transactionId: number): Promise<any[]> {
    try {
      console.log(`=== TRANSACTION ITEMS: Fetching for transaction ${transactionId}`);
      const items = await db.select().from(transactionItems)
        .where(eq(transactionItems.transactionId, transactionId));
      console.log(`=== TRANSACTION ITEMS: Found ${items.length} items`);
      return items;
    } catch (error) {
      console.error('Error getting transaction items:', error);
      return [];
    }
  }

  // Delete transaction
  async deleteTransaction(transactionId: number): Promise<void> {
    try {
      console.log(`=== DELETE TRANSACTION: Starting deletion for ${transactionId}`);
      
      // First delete transaction items
      await db.delete(transactionItems).where(eq(transactionItems.transactionId, transactionId));
      console.log(`=== DELETE TRANSACTION: Deleted items for transaction ${transactionId}`);
      
      // Then delete the transaction
      await db.delete(transactions).where(eq(transactions.id, transactionId));
      console.log(`=== DELETE TRANSACTION: Deleted transaction ${transactionId}`);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Product operations
  async getLowStockProducts(storeId: number): Promise<any[]> {
    try {
      const lowStock = await db.select().from(products)
        .where(and(
          eq(products.storeId, storeId),
          sql`stock <= min_stock`
        ));
      return lowStock;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }

  // Staff operations
  async assignUserToStore(userId: string, storeId: number, role: string): Promise<StoreStaff> {
    const now = new Date();
    const [assignment] = await db.insert(storeStaff)
      .values({
        userId,
        storeId,
        role,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return assignment;
  }

  // Communication methods (stubs)
  async getWhatsappSettings(storeId: number): Promise<any> {
    return { storeId, provider: 'ultramsg', isActive: false };
  }

  async updateWhatsappSettings(storeId: number, settings: any): Promise<any> {
    return settings;
  }

  async getWhatsappTemplates(storeId: number): Promise<any[]> {
    return [];
  }

  async createWhatsappTemplate(storeId: number, template: any): Promise<any> {
    return template;
  }

  async getWhatsappMessages(storeId: number): Promise<any[]> {
    return [];
  }

  async getWhatsappTemplate(storeId: number, templateId: number): Promise<any> {
    return null;
  }

  async createWhatsappMessage(storeId: number, message: any): Promise<any> {
    return message;
  }

  async updateWhatsappMessageStatus(messageId: number, status: string): Promise<any> {
    return { id: messageId, status };
  }



  // Export methods
  async exportCustomersToExcel(storeId: number): Promise<any> {
    const customers = await this.getCustomersWithSpending(storeId);
    return customers;
  }

  async getCustomerSpending(customerId: number): Promise<any> {
    try {
      const transactions = await this.getCustomerTransactions(customerId);
      const totalSpent = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      return { customerId, totalSpent, transactions };
    } catch (error) {
      return { customerId, totalSpent: 0, transactions: [] };
    }
  }

  // Communication settings (stubs)
  async getSmsSettings(storeId: number): Promise<any> {
    return { storeId, provider: 'msg91', isActive: false };
  }

  async createSmsSettings(storeId: number, settings: any): Promise<any> {
    return settings;
  }

  async updateSmsSettings(storeId: number, settings: any): Promise<any> {
    return settings;
  }

  async getEmailSettings(storeId: number): Promise<any> {
    return { storeId, provider: 'smtp', isActive: false };
  }

  async createEmailSettings(storeId: number, settings: any): Promise<any> {
    return settings;
  }

  async updateEmailSettings(storeId: number, settings: any): Promise<any> {
    return settings;
  }

  async getCommunicationTemplates(storeId: number): Promise<any[]> {
    return [];
  }

  async createCommunicationTemplate(storeId: number, template: any): Promise<any> {
    return template;
  }

  async updateCommunicationTemplate(templateId: number, template: any): Promise<any> {
    return template;
  }

  async deleteCommunicationTemplate(templateId: number): Promise<void> {
    // Stub implementation
  }

  async getCommunicationMessages(storeId: number): Promise<any[]> {
    return [];
  }

  async getCustomerCommunicationPreferences(customerId: number): Promise<any> {
    return { customerId, emailEnabled: true, smsEnabled: true, whatsappEnabled: true };
  }

  async createCustomerCommunicationPreferences(preferences: any): Promise<any> {
    return preferences;
  }

  async updateCustomerCommunicationPreferences(customerId: number, preferences: any): Promise<any> {
    return preferences;
  }

  async getAppointmentStaff(appointmentId: number): Promise<any[]> {
    return [];
  }

  async assignStaffToAppointment(appointmentId: number, staffId: string): Promise<any> {
    return { appointmentId, staffId };
  }

  async removeStaffFromAppointment(appointmentId: number, staffId: string): Promise<void> {
    // Stub implementation
  }

  async getStaffPerformance(storeId: number, startDate: Date, endDate: Date): Promise<any> {
    return { storeId, performance: [] };
  }
}

export const storage = new DatabaseStorage();