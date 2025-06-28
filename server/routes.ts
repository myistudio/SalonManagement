import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupBasicAuth, isAuthenticated } from "./auth-basic";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import express from "express";
import {
  insertCustomerSchema,
  insertServiceSchema,
  insertServiceCategorySchema,
  insertProductSchema,
  insertProductCategorySchema,
  insertMembershipPlanSchema,
  insertTransactionSchema,
  insertTransactionItemSchema,
  users,
  storeStaff,
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for product/service images
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadLogo = multer({ 
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

const uploadImage = multer({ 
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Role-based authentication middleware for basic auth
const requireRole = (allowedRoles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user; // Get user directly from basic auth session
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupBasicAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Image upload endpoint for products and services
  app.post('/api/upload/image', isAuthenticated, uploadImage.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user; // Direct user object from basic auth
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Store routes
  app.get('/api/stores', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user; // Direct user object from basic auth
      
      if (user?.role === 'super_admin') {
        const stores = await storage.getStores();
        res.json(stores);
      } else {
        const userStores = await storage.getUserStores(user.id);
        res.json(userStores);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post('/api/stores', isAuthenticated, requireRole(['super_admin']), async (req: any, res) => {
    try {
      const storeData = req.body;
      const newStore = await storage.createStore(storeData);
      res.status(201).json(newStore);
    } catch (error) {
      console.error("Error creating store:", error);
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.get('/api/stores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  app.patch('/api/stores/:id', isAuthenticated, requireRole(['super_admin', 'store_manager']), uploadLogo.single('logo'), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const updateData: any = { ...req.body };

      // Handle logo upload
      if (req.file) {
        const logoUrl = `/uploads/logos/${req.file.filename}`;
        updateData.logoUrl = logoUrl;
      }

      const updatedStore = await storage.updateStore(storeId, updateData);
      res.json(updatedStore);
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete('/api/stores/:id', isAuthenticated, requireRole(['super_admin']), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      await storage.deleteStore(storeId);
      res.json({ message: "Store deleted successfully" });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = req.query.storeId ? parseInt(req.query.storeId) : undefined;
      const customers = await storage.getCustomers(storeId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/search', isAuthenticated, async (req: any, res) => {
    try {
      const { mobile } = req.query;
      if (!mobile) {
        return res.status(400).json({ message: "Mobile number is required" });
      }
      const customer = await storage.getCustomerByMobile(mobile);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Get customer membership if any
      const membership = await storage.getCustomerMembership(customer.id);
      
      res.json({ ...customer, membership });
    } catch (error) {
      res.status(500).json({ message: "Failed to search customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const membership = await storage.getCustomerMembership(customer.id);
      res.json({ ...customer, membership });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Service category routes
  app.get("/api/service-categories", isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const categories = await storage.getServiceCategories(storeId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  app.post("/api/service-categories", isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating service category:", error);
      res.status(500).json({ message: "Failed to create service category" });
    }
  });

  app.put("/api/service-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertServiceCategorySchema.partial().parse(req.body);
      const category = await storage.updateServiceCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating service category:", error);
      res.status(500).json({ message: "Failed to update service category" });
    }
  });

  app.delete("/api/service-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteServiceCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service category:", error);
      res.status(500).json({ message: "Failed to delete service category" });
    }
  });

  // Service routes
  app.get('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const services = await storage.getServices(storeId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(serviceId, serviceData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Product category routes
  app.get("/api/product-categories", isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const categories = await storage.getProductCategories(storeId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  app.post("/api/product-categories", isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createProductCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating product category:", error);
      res.status(500).json({ message: "Failed to create product category" });
    }
  });

  app.put("/api/product-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertProductCategorySchema.partial().parse(req.body);
      const category = await storage.updateProductCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating product category:", error);
      res.status(500).json({ message: "Failed to update product category" });
    }
  });

  app.delete("/api/product-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product category:", error);
      res.status(500).json({ message: "Failed to delete product category" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const products = await storage.getProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/scan/:barcode', isAuthenticated, async (req: any, res) => {
    try {
      const { barcode } = req.params;
      const product = await storage.getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to scan product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      // Generate QR code for the product if not provided
      if (!productData.qrCode) {
        productData.qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products/low-stock/:storeId', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const products = await storage.getLowStockProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  // Membership routes
  app.get('/api/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const plans = await storage.getMembershipPlans(storeId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership plans" });
    }
  });

  app.post('/api/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const planData = insertMembershipPlanSchema.parse(req.body);
      const plan = await storage.createMembershipPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid membership plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create membership plan" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const transactions = await storage.getTransactions(storeId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: "Failed to fetch transactions", error: (error as Error).message });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { transaction, items } = req.body;
      const userId = req.user.id; // Use basic auth user id
      
      console.log('Transaction request data:', { transaction, items, userId });
      
      // Generate invoice number
      const invoiceNumber = await storage.generateInvoiceNumber(transaction.storeId);
      
      // Prepare transaction data for validation
      const transactionForValidation = {
        ...transaction,
        staffId: userId,
        invoiceNumber,
      };
      
      console.log('Transaction data for validation:', transactionForValidation);
      
      // Validate transaction data
      const transactionData = insertTransactionSchema.parse(transactionForValidation);
      
      // Prepare items data (validation will happen in storage after transaction creation)
      const itemsData = items.map((item: any) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));
      
      // Create transaction
      const newTransaction = await storage.createTransaction(transactionData, itemsData);
      
      // Update customer loyalty points and stats if customer exists
      if (transaction.customerId) {
        const pointsEarned = Math.floor(parseFloat(transaction.totalAmount) * 0.01); // 1 point per 100 rupees
        await storage.updateCustomerLoyalty(
          transaction.customerId,
          pointsEarned - (transaction.pointsRedeemed || 0),
          1,
          transaction.totalAmount
        );
      }
      
      // Update product stock for product items
      for (const item of itemsData) {
        if (item.itemType === 'product') {
          if (item.itemId) {
            await storage.updateProductStock(item.itemId, item.quantity);
          }
        }
      }
      
      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Transaction creation error:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.get('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  // Staff routes
  app.get('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string) || 1;
      const staff = await storage.getStoreStaff(storeId);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // Create staff with password
  app.post('/api/staff/create', isAuthenticated, requireRole(['super_admin', 'store_manager']), async (req: any, res) => {
    try {
      const { email, mobile, password, firstName, lastName, role, storeId } = req.body;
      
      if (!email && !mobile) {
        return res.status(400).json({ message: "Email or mobile number is required" });
      }
      if (!password || !firstName || !role || !storeId) {
        return res.status(400).json({ message: "Password, first name, role, and store ID are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmailOrMobile(email || mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email or mobile" });
      }

      // Hash password
      const { scrypt, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = await storage.createUser({
        id: userId,
        email: email || null,
        mobile: mobile || null,
        password: hashedPassword,
        firstName,
        lastName: lastName || null,
        profileImageUrl: null,
        role,
        isActive: true,
      });

      // Add user to store staff
      const newStaff = await storage.assignUserToStore(user.id, storeId, role);

      res.status(201).json({
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.post('/api/staff', isAuthenticated, requireRole(['super_admin', 'store_manager']), async (req: any, res) => {
    try {
      const { email, role, storeId } = req.body;
      
      if (!email || !role || !storeId) {
        return res.status(400).json({ message: "Email, role, and store ID are required" });
      }

      // Find or create user by email
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        // Create a pending user account for invitation
        [user] = await db
          .insert(users)
          .values({
            id: `pending_${Date.now()}`,
            email,
            firstName: email.split('@')[0], // Use email prefix as temporary name
            lastName: null,
            profileImageUrl: null,
          })
          .returning();
      }

      // Check if user is already staff at this store
      const [existingStaff] = await db
        .select()
        .from(storeStaff)
        .where(and(eq(storeStaff.userId, user.id), eq(storeStaff.storeId, storeId)));

      if (existingStaff) {
        return res.status(400).json({ message: "User is already a staff member at this store" });
      }

      // Add user to store staff
      const newStaff = await storage.assignUserToStore(user.id, storeId, role);

      // Update user's role
      await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      res.json(newStaff);
    } catch (error) {
      console.error("Error adding staff:", error);
      res.status(500).json({ message: "Failed to add staff member" });
    }
  });

  app.patch('/api/staff/:userId/role', isAuthenticated, requireRole(['super_admin', 'store_manager']), async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const { role, storeId } = req.body;
      
      if (!role || !storeId) {
        return res.status(400).json({ message: "Role and store ID are required" });
      }

      // Update user role
      const [updatedUser] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      // Update store staff role if exists
      await db
        .update(storeStaff)
        .set({ role })
        .where(and(eq(storeStaff.userId, userId), eq(storeStaff.storeId, storeId)));

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating staff role:", error);
      res.status(500).json({ message: "Failed to update staff role" });
    }
  });

  // Change staff password
  app.patch('/api/staff/:userId/password', isAuthenticated, requireRole(['super_admin', 'store_manager']), async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Hash the new password
      const { scrypt, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      // Update user password
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.delete('/api/staff/:userId/:storeId', isAuthenticated, requireRole(['super_admin', 'store_manager']), async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const storeId = parseInt(req.params.storeId);
      
      // Remove from store staff
      await db
        .delete(storeStaff)
        .where(and(eq(storeStaff.userId, userId), eq(storeStaff.storeId, storeId)));

      res.json({ message: "Staff member removed successfully" });
    } catch (error) {
      console.error("Error removing staff:", error);
      res.status(500).json({ message: "Failed to remove staff member" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats/:storeId', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const stats = await storage.getDashboardStats(storeId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports routes
  app.get('/api/reports/sales', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (!storeId || !startDate || !endDate) {
        return res.status(400).json({ message: "Store ID, start date, and end date are required" });
      }
      
      const report = await storage.getSalesReport(storeId, startDate, endDate);
      console.log("Sales report generated:", JSON.stringify(report, null, 2));
      res.json(report);
    } catch (error) {
      console.error("Sales report error:", error);
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
