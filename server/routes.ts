import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupBasicAuth, isAuthenticated, hasStoreAccess, requireRole, requirePermission, Permission } from "./auth-basic";
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
  whatsappMessages,
  customers,
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

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

// Input validation middleware
const validateInput = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: result.error.issues 
        });
      }
      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error("Validation error:", error);
      res.status(400).json({ message: "Invalid request data" });
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

      // Handle checkbox conversion for enableTax
      if (updateData.enableTax !== undefined) {
        updateData.enableTax = updateData.enableTax === 'on' || updateData.enableTax === true;
      }

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
  app.get('/api/customers', isAuthenticated, requirePermission(Permission.VIEW_CUSTOMERS), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = req.query.storeId ? parseInt(req.query.storeId) : undefined;
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const customers = await storage.getCustomers(storeId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/search', isAuthenticated, requirePermission(Permission.VIEW_CUSTOMERS), hasStoreAccess, async (req: any, res) => {
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
      console.error("Error searching customer:", error);
      res.status(500).json({ message: "Failed to search customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, requirePermission(Permission.CREATE_CUSTOMERS), hasStoreAccess, validateInput(insertCustomerSchema), async (req: any, res) => {
    try {
      const customerData = req.validatedData;
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      
      // Handle duplicate mobile number error
      if (error instanceof Error && error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message });
      }
      
      console.error("Error creating customer:", error);
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

  app.get('/api/customers/:id/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const transactions = await storage.getCustomerTransactions(customerId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer transactions" });
    }
  });

  // Enhanced customer routes for tabular view with spending data
  app.get('/api/customers/export/:storeId', isAuthenticated, requirePermission(Permission.VIEW_CUSTOMERS), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      
      // Check if request wants Excel file or JSON data
      const format = req.query.format;
      
      if (format === 'excel') {
        // Import XLSX for Excel export
        const XLSX = await import('xlsx');
        
        const customersData = await storage.getCustomersWithSpending(storeId);
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(customersData.map(customer => ({
          'Customer Name': `${customer.firstName} ${customer.lastName || ''}`.trim(),
          'Mobile': customer.mobile,
          'Email': customer.email || '',
          'Gender': customer.gender || '',
          'Date of Birth': customer.dateOfBirth || '',
          'Total Visits': customer.totalVisits,
          'Current Year Spending': parseFloat(customer.currentYearSpending || '0').toFixed(2),
          'Lifetime Spending': parseFloat(customer.lifetimeSpending || customer.totalSpent || '0').toFixed(2),
          'Loyalty Points': customer.loyaltyPoints,
          'Membership Plan': customer.membershipPlan || 'None',
          'Customer Since': new Date(customer.createdAt).toLocaleDateString(),
        })));
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
        
        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=customers_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(excelBuffer);
      } else {
        // Return JSON data for frontend table
        const customersData = await storage.getCustomersWithSpending(storeId);
        res.json(customersData);
      }
    } catch (error) {
      console.error("Error exporting customers:", error);
      res.status(500).json({ message: "Failed to export customers" });
    }
  });

  // Assign membership to customer
  app.post('/api/customers/:id/membership', isAuthenticated, requirePermission(Permission.VIEW_CUSTOMERS), hasStoreAccess, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { membershipPlanId } = req.body;
      
      if (!membershipPlanId) {
        return res.status(400).json({ message: "Membership plan ID is required" });
      }
      
      await storage.assignMembershipToCustomer(customerId, membershipPlanId);
      res.json({ message: "Membership assigned successfully" });
    } catch (error) {
      console.error("Error assigning membership:", error);
      res.status(500).json({ message: "Failed to assign membership" });
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
  app.get('/api/services', isAuthenticated, requirePermission(Permission.VIEW_SERVICES), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const services = await storage.getServices(storeId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, requirePermission(Permission.MANAGE_SERVICES), hasStoreAccess, validateInput(insertServiceSchema), async (req: any, res) => {
    try {
      const serviceData = req.validatedData;
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
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
  app.get('/api/products', isAuthenticated, requirePermission(Permission.VIEW_INVENTORY), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      const products = await storage.getProducts(storeId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/scan/:barcode', isAuthenticated, requirePermission(Permission.VIEW_INVENTORY), async (req: any, res) => {
    try {
      const { barcode } = req.params;
      const product = await storage.getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error scanning product:", error);
      res.status(500).json({ message: "Failed to scan product" });
    }
  });

  app.post('/api/products', isAuthenticated, requirePermission(Permission.MANAGE_INVENTORY), hasStoreAccess, validateInput(insertProductSchema), async (req: any, res) => {
    try {
      const productData = req.validatedData;
      // Generate QR code for the product if not provided
      if (!productData.qrCode) {
        productData.qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Product validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, requirePermission(Permission.MANAGE_INVENTORY), hasStoreAccess, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Create clean request body without cost field transformation issues
      const requestBody = { ...req.body };
      
      // Handle cost field properly - if empty string or null, set to null
      if (requestBody.cost === "" || requestBody.cost === null || requestBody.cost === undefined) {
        requestBody.cost = null;
      }
      
      // Skip Zod validation for updates and manually prepare data
      const productData: any = {};
      
      if (requestBody.name !== undefined) productData.name = requestBody.name;
      if (requestBody.description !== undefined) productData.description = requestBody.description;
      if (requestBody.price !== undefined) productData.price = requestBody.price.toString();
      if (requestBody.cost !== undefined) productData.cost = requestBody.cost ? requestBody.cost.toString() : null;
      if (requestBody.barcode !== undefined) productData.barcode = requestBody.barcode;
      if (requestBody.category !== undefined) productData.category = requestBody.category;
      if (requestBody.brand !== undefined) productData.brand = requestBody.brand;
      if (requestBody.stock !== undefined) productData.stock = parseInt(requestBody.stock) || 0;
      if (requestBody.minStock !== undefined) productData.minStock = parseInt(requestBody.minStock) || 5;
      if (requestBody.imageUrl !== undefined) productData.imageUrl = requestBody.imageUrl;
      if (requestBody.storeId !== undefined) productData.storeId = parseInt(requestBody.storeId);
      
      console.log('Final product data for update:', productData);
      const product = await storage.updateProduct(productId, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
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
      console.log('Creating membership plan with data:', req.body);
      const planData = insertMembershipPlanSchema.parse(req.body);
      console.log('Parsed plan data:', planData);
      const plan = await storage.createMembershipPlan(planData);
      console.log('Created plan:', plan);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating membership plan:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid membership plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create membership plan", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, requirePermission(Permission.MANAGE_TRANSACTIONS), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50; // Default to 50
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }
      
      const transactions = await storage.getTransactions(storeId, limit, startDate, endDate);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: "Failed to fetch transactions", error: (error as Error).message });
    }
  });

  app.post('/api/transactions', isAuthenticated, requirePermission(Permission.CREATE_BILLS), hasStoreAccess, async (req: any, res) => {
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
  app.get('/api/staff', isAuthenticated, requirePermission(Permission.MANAGE_STORE_STAFF), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string) || 9;
      const staff = await storage.getStoreStaff(storeId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // Staff routes for billing modal (alternative endpoint)
  app.get('/api/stores/:id/staff', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      console.log(`Fetching staff for store ${storeId}`);
      const staff = await storage.getStoreStaff(storeId);
      console.log(`Found ${staff.length} staff members:`, staff);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching store staff:", error);
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

      // Check if user already exists by email
      if (email) {
        const existingUserByEmail = await storage.getUserByEmail(email);
        if (existingUserByEmail) {
          // Check if user is already assigned to this store
          const existingStaff = await db
            .select()
            .from(storeStaff)
            .where(and(eq(storeStaff.userId, existingUserByEmail.id), eq(storeStaff.storeId, storeId)));
          
          if (existingStaff.length > 0) {
            return res.status(400).json({ message: "This user is already a staff member at this store" });
          }
          
          // User exists but not at this store - we can add them
          const newStaff = await storage.assignUserToStore(existingUserByEmail.id, storeId, role);
          
          // Update user's role if different
          if (existingUserByEmail.role !== role) {
            await db
              .update(users)
              .set({ role, updatedAt: new Date() })
              .where(eq(users.id, existingUserByEmail.id));
          }
          
          return res.status(201).json({
            id: existingUserByEmail.id,
            email: existingUserByEmail.email,
            mobile: existingUserByEmail.mobile,
            firstName: existingUserByEmail.firstName,
            lastName: existingUserByEmail.lastName,
            role: role,
          });
        }
      }

      // Check if user already exists by mobile
      if (mobile) {
        const existingUserByMobile = await storage.getUserByMobile(mobile);
        if (existingUserByMobile) {
          // Check if user is already assigned to this store
          const existingStaff = await db
            .select()
            .from(storeStaff)
            .where(and(eq(storeStaff.userId, existingUserByMobile.id), eq(storeStaff.storeId, storeId)));
          
          if (existingStaff.length > 0) {
            return res.status(400).json({ message: "This user is already a staff member at this store" });
          }
          
          // User exists but not at this store - we can add them
          const newStaff = await storage.assignUserToStore(existingUserByMobile.id, storeId, role);
          
          // Update user's role if different
          if (existingUserByMobile.role !== role) {
            await db
              .update(users)
              .set({ role, updatedAt: new Date() })
              .where(eq(users.id, existingUserByMobile.id));
          }
          
          return res.status(201).json({
            id: existingUserByMobile.id,
            email: existingUserByMobile.email,
            mobile: existingUserByMobile.mobile,
            firstName: existingUserByMobile.firstName,
            lastName: existingUserByMobile.lastName,
            role: role,
          });
        }
      }

      // Hash password using bcrypt (same as auth system)
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

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

      // Check if user is already assigned to any store
      const existingAssignment = await db
        .select()
        .from(storeStaff)
        .where(eq(storeStaff.userId, userId));

      if (existingAssignment.length > 0) {
        // Update existing store assignment - move to new store with new role
        await db
          .update(storeStaff)
          .set({ storeId, role, updatedAt: new Date() })
          .where(eq(storeStaff.userId, userId));
      } else {
        // Create new store assignment
        await db
          .insert(storeStaff)
          .values({
            userId,
            storeId,
            role,
          });
      }

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

  app.patch('/api/staff/:userId/profile', isAuthenticated, requireRole(['super_admin', 'store_manager']), async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const { firstName, lastName, email, mobile } = req.body;
      
      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({ 
          firstName, 
          lastName, 
          email, 
          mobile, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating staff profile:", error);
      res.status(500).json({ message: "Failed to update staff profile" });
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
  app.get('/api/dashboard/stats/:storeId', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const stats = await storage.getDashboardStats(storeId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports routes
  app.get('/api/reports/sales', isAuthenticated, requirePermission(Permission.VIEW_STORE_REPORTS), hasStoreAccess, async (req: any, res) => {
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

  app.get('/api/reports/analytics', isAuthenticated, requirePermission(Permission.VIEW_STORE_REPORTS), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (!storeId || !startDate || !endDate) {
        return res.status(400).json({ message: "Store ID, start date, and end date are required" });
      }
      
      const analytics = await storage.getAdvancedAnalytics(storeId, startDate, endDate);
      res.json(analytics);
    } catch (error) {
      console.error("Advanced analytics error:", error);
      res.status(500).json({ message: "Failed to generate advanced analytics" });
    }
  });

  app.get('/api/reports/daily-sales', isAuthenticated, requirePermission(Permission.VIEW_STORE_REPORTS), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const date = new Date(req.query.date as string);
      
      if (!storeId || !date) {
        return res.status(400).json({ message: "Store ID and date are required" });
      }
      
      const report = await storage.getDailySalesReport(storeId, date);
      res.json(report);
    } catch (error) {
      console.error("Daily sales report error:", error);
      res.status(500).json({ message: "Failed to generate daily sales report" });
    }
  });

  app.get('/api/reports/staff-performance', isAuthenticated, requirePermission(Permission.VIEW_STORE_REPORTS), hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (!storeId || !startDate || !endDate) {
        return res.status(400).json({ message: "Store ID, start date, and end date are required" });
      }
      
      const report = await storage.getStaffPerformanceReport(storeId, startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error("Staff performance report error:", error);
      res.status(500).json({ message: "Failed to generate staff performance report" });
    }
  });

  // WhatsApp Business API routes
  app.get('/api/whatsapp/settings/:storeId', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.getWhatsappSettings(storeId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch WhatsApp settings" });
    }
  });

  app.put('/api/whatsapp/settings/:storeId', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      console.log('Updating WhatsApp settings for store:', storeId, 'with data:', req.body);
      const settings = await storage.updateWhatsappSettings(storeId, req.body);
      console.log('WhatsApp settings updated successfully:', settings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating WhatsApp settings:", error);
      res.status(500).json({ message: "Failed to update WhatsApp settings", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/whatsapp/templates', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      console.log('Fetching WhatsApp templates for store:', storeId);
      const templates = await storage.getWhatsappTemplates(storeId);
      console.log('WhatsApp templates fetched:', templates.length, 'templates');
      res.json(templates);
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp templates", error: error.message });
    }
  });

  app.post('/api/whatsapp/templates', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      console.log('Creating WhatsApp template with data:', req.body);
      const template = await storage.createWhatsappTemplate(req.body);
      console.log('WhatsApp template created successfully:', template);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating WhatsApp template:", error);
      res.status(500).json({ message: "Failed to create WhatsApp template", error: error.message });
    }
  });

  app.get('/api/whatsapp/messages', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const limit = parseInt(req.query.limit as string) || 50;
      console.log('Fetching WhatsApp messages for store:', storeId, 'limit:', limit);
      const messages = await storage.getWhatsappMessages(storeId, limit);
      console.log('WhatsApp messages fetched:', messages.length, 'messages');
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp messages", error: error.message });
    }
  });

  // Get incoming WhatsApp messages (customer replies)
  app.get('/api/whatsapp/incoming-messages', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const storeId = parseInt(req.query.storeId as string);
      const limit = parseInt(req.query.limit as string) || 50;
      
      console.log('Fetching incoming WhatsApp messages for store:', storeId);
      
      // Get messages where messageType is 'incoming' (customer replies)
      const messages = await db
        .select({
          id: whatsappMessages.id,
          phoneNumber: whatsappMessages.phoneNumber,
          content: whatsappMessages.content,
          createdAt: whatsappMessages.createdAt,
          customer: {
            id: customers.id,
            firstName: customers.firstName,
            lastName: customers.lastName,
            mobile: customers.mobile
          }
        })
        .from(whatsappMessages)
        .leftJoin(customers, eq(whatsappMessages.customerId, customers.id))
        .where(and(
          eq(whatsappMessages.storeId, storeId),
          eq(whatsappMessages.messageType, 'incoming')
        ))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(limit);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching incoming WhatsApp messages:", error);
      res.status(500).json({ message: "Failed to fetch incoming messages" });
    }
  });

  app.post('/api/whatsapp/send-test', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const { storeId, phoneNumber, templateId } = req.body;
      
      const settings = await storage.getWhatsappSettings(storeId);
      if (!settings || !settings.isEnabled) {
        return res.status(400).json({ message: "WhatsApp is not enabled for this store" });
      }

      const template = await storage.getWhatsappTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Create message record
      const message = await storage.createWhatsappMessage({
        storeId,
        phoneNumber,
        messageType: 'test',
        templateId,
        content: template.content,
        status: 'pending'
      });

      // Send via WhatsApp Business API
      const { whatsappService } = await import('./whatsapp-service');
      const result = await whatsappService.sendTextMessage(
        phoneNumber,
        template.content,
        settings
      );

      // Update message status
      await storage.updateWhatsappMessageStatus(
        message.id,
        result.success ? 'sent' : 'failed',
        result.messageId,
        result.error
      );

      res.json({ success: result.success, message: result.error || 'Message sent successfully' });
    } catch (error) {
      console.error('WhatsApp send error:', error);
      res.status(500).json({ message: "Failed to send test message" });
    }
  });

  // Send test WhatsApp message
  app.post('/api/whatsapp/send-test-message', isAuthenticated, hasStoreAccess, async (req: any, res) => {
    try {
      const { phoneNumber, message, storeId } = req.body;
      
      if (!phoneNumber || !message || !storeId) {
        return res.status(400).json({ message: "Phone number, message, and store ID are required" });
      }

      console.log(`Sending test WhatsApp message to ${phoneNumber}: ${message}`);
      
      // Get WhatsApp settings for the store
      const settings = await storage.getWhatsappSettings(storeId);
      if (!settings?.accessToken) {
        return res.status(400).json({ message: "WhatsApp access token not configured for this store" });
      }

      // Store the message in our database first
      const whatsappMessage = await storage.createWhatsappMessage({
        storeId,
        phoneNumber,
        messageType: 'test',
        content: message,
        status: 'pending',
        sentAt: new Date(),
      });

      // Here you would normally send the message via WhatsApp Business API
      // For now, we'll simulate it and update the status
      setTimeout(async () => {
        try {
          await storage.updateWhatsappMessageStatus(whatsappMessage.id, 'sent', 'test_' + Date.now());
          console.log('Test message marked as sent');
        } catch (error) {
          console.error('Failed to update message status:', error);
        }
      }, 1000);

      res.json({ 
        success: true, 
        message: "Test message queued for sending",
        messageId: whatsappMessage.id 
      });
    } catch (error) {
      console.error("Error sending test message:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to send test message", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // WhatsApp Webhook endpoints for receiving customer messages
  app.get('/api/whatsapp/webhook', async (req, res) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('WhatsApp webhook verification:', { mode, token, challenge });

      // Verify the webhook (this should match your webhook verify token in settings)
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.log('WhatsApp webhook verification failed');
        res.status(403).send('Forbidden');
      }
    } catch (error) {
      console.error('WhatsApp webhook verification error:', error);
      res.status(500).send('Error');
    }
  });

  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      console.log('WhatsApp webhook received:', JSON.stringify(req.body, null, 2));
      
      const body = req.body;
      
      // Check if this is a WhatsApp API event
      if (body.object === 'whatsapp_business_account') {
        // Process each entry
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              await processIncomingMessage(change.value);
            }
          }
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('WhatsApp webhook processing error:', error);
      res.status(500).send('Error');
    }
  });

  // Function to process incoming WhatsApp messages
  async function processIncomingMessage(messageData: any) {
    try {
      console.log('Processing incoming WhatsApp message:', messageData);
      
      const messages = messageData.messages || [];
      
      for (const message of messages) {
        // Extract message details
        const fromNumber = message.from;
        const messageType = message.type;
        const messageId = message.id;
        const timestamp = new Date(parseInt(message.timestamp) * 1000);
        
        // Get message content based on type
        let content = '';
        if (messageType === 'text') {
          content = message.text?.body || '';
        } else if (messageType === 'image') {
          content = `[Image] ${message.image?.caption || ''}`;
        } else if (messageType === 'document') {
          content = `[Document] ${message.document?.filename || ''}`;
        } else {
          content = `[${messageType.toUpperCase()}] Unsupported message type`;
        }
        
        // Try to find customer by phone number
        const customer = await storage.getCustomerByMobile(fromNumber);
        
        // Find which store this message belongs to (you might need to implement logic based on phone number routing)
        const storeId = 1; // Default to store 1, or implement your routing logic
        
        // Save the incoming message
        await storage.createWhatsappMessage({
          storeId,
          customerId: customer?.id || null,
          phoneNumber: fromNumber,
          messageType: 'incoming',
          content,
          status: 'received',
          whatsappMessageId: messageId,
        });
        
        console.log('Incoming WhatsApp message saved:', {
          from: fromNumber,
          customer: customer?.firstName,
          content: content.substring(0, 50) + '...'
        });
        
        // You can add auto-reply logic here if needed
        // await sendAutoReply(fromNumber, customer, storeId);
      }
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  // Public login page settings endpoint
  app.get("/api/login-settings", async (req, res) => {
    try {
      const settings = await storage.getLoginPageSettings();
      res.json(settings || {
        companyName: "SalonPro",
        tagline: "Manage Your Beauty Business",
        description: "Complete salon management solution with billing, inventory, customer loyalty, and multi-store support.",
        logoUrl: null,
        backgroundColor: "from-purple-600 via-pink-600 to-indigo-600"
      });
    } catch (error) {
      console.error("Error fetching login settings:", error);
      res.status(500).json({ message: "Failed to fetch login settings" });
    }
  });

  // Login page customization routes (super admin only)
  app.get("/api/admin/login-settings", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Unauthorized - Super admin access required" });
      }
      
      const settings = await storage.getLoginPageSettings();
      res.json(settings || {
        companyName: "SalonPro",
        tagline: "Manage Your Beauty Business",
        description: "Complete salon management solution with billing, inventory, customer loyalty, and multi-store support.",
        logoUrl: null,
        backgroundColor: "from-purple-600 via-pink-600 to-indigo-600"
      });
    } catch (error) {
      console.error("Error fetching login settings:", error);
      res.status(500).json({ message: "Failed to fetch login settings" });
    }
  });

  app.put("/api/admin/login-settings", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Unauthorized - Super admin access required" });
      }

      const settings = await storage.updateLoginPageSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating login settings:", error);
      res.status(500).json({ message: "Failed to update login settings" });
    }
  });

  // Appointment API routes (public - no authentication required)
  app.get("/api/appointments/stores", async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores.filter(store => store.isActive));
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.get("/api/appointments/services/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const services = await storage.getServices(storeId);
      res.json(services.filter(service => service.isActive));
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/appointments/time-slots/:storeId/:date", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const date = new Date(req.params.date);
      const slots = await storage.getAvailableTimeSlots(storeId, date);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      // Handle empty string dates properly for public booking
      const requestBody = { ...req.body };
      if (requestBody.dateOfBirth === '') {
        requestBody.dateOfBirth = null;
      }
      if (requestBody.customerEmail === '') {
        requestBody.customerEmail = null;
      }
      if (requestBody.gender === '') {
        requestBody.gender = null;
      }
      if (requestBody.notes === '') {
        requestBody.notes = null;
      }
      
      const appointment = await storage.createAppointment(requestBody);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Appointment management routes (protected - requires authentication)
  app.get("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const storeId = parseInt(req.query.storeId as string);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      const appointments = await storage.getAppointments(storeId, date);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.put("/api/appointments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const appointment = await storage.updateAppointment(id, req.body);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteAppointment(id);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Appointment settings routes
  app.get("/api/appointment-settings/:storeId", isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.getAppointmentSettings(storeId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching appointment settings:", error);
      res.status(500).json({ message: "Failed to fetch appointment settings" });
    }
  });

  app.post("/api/appointment-settings", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const settings = await storage.createAppointmentSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating appointment settings:", error);
      res.status(500).json({ message: "Failed to create appointment settings" });
    }
  });

  app.put("/api/appointment-settings/:storeId", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.updateAppointmentSettings(storeId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating appointment settings:", error);
      res.status(500).json({ message: "Failed to update appointment settings" });
    }
  });

  // Customer export route
  app.get("/api/customers/export/:storeId", isAuthenticated, requirePermission(Permission.VIEW_CUSTOMERS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const customers = await storage.getCustomersWithSpending(storeId);
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
      
      const excelBuffer = await storage.exportCustomersToExcel(customers);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting customers:", error);
      res.status(500).json({ message: "Failed to export customers" });
    }
  });

  // Customer spending route 
  app.get("/api/customers/:id/spending", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const spending = await storage.getCustomerSpending(customerId);
      res.json(spending);
    } catch (error) {
      console.error("Error fetching customer spending:", error);
      res.status(500).json({ message: "Failed to fetch customer spending" });
    }
  });

  // Assign membership to customer
  app.post("/api/customers/:id/membership", isAuthenticated, requirePermission(Permission.MANAGE_MEMBERSHIPS), async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { membershipPlanId } = req.body;
      const membership = await storage.assignMembershipToCustomer(customerId, membershipPlanId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error assigning membership:", error);
      res.status(500).json({ message: "Failed to assign membership" });
    }
  });

  // SMS Settings routes
  app.get("/api/sms-settings/:storeId", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.getSmsSettings(storeId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching SMS settings:", error);
      res.status(500).json({ message: "Failed to fetch SMS settings" });
    }
  });

  app.post("/api/sms-settings", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const settings = await storage.createSmsSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating SMS settings:", error);
      res.status(500).json({ message: "Failed to create SMS settings" });
    }
  });

  app.put("/api/sms-settings/:storeId", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.updateSmsSettings(storeId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating SMS settings:", error);
      res.status(500).json({ message: "Failed to update SMS settings" });
    }
  });

  // Email Settings routes
  app.get("/api/email-settings/:storeId", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.getEmailSettings(storeId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.post("/api/email-settings", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const settings = await storage.createEmailSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating email settings:", error);
      res.status(500).json({ message: "Failed to create email settings" });
    }
  });

  app.put("/api/email-settings/:storeId", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settings = await storage.updateEmailSettings(storeId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  // Communication Templates routes
  app.get("/api/communication-templates/:storeId", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const templates = await storage.getCommunicationTemplates(storeId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching communication templates:", error);
      res.status(500).json({ message: "Failed to fetch communication templates" });
    }
  });

  app.post("/api/communication-templates", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const template = await storage.createCommunicationTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating communication template:", error);
      res.status(500).json({ message: "Failed to create communication template" });
    }
  });

  app.put("/api/communication-templates/:id", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateCommunicationTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating communication template:", error);
      res.status(500).json({ message: "Failed to update communication template" });
    }
  });

  app.delete("/api/communication-templates/:id", isAuthenticated, requirePermission(Permission.MANAGE_STORE_SETTINGS), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCommunicationTemplate(id);
      res.json({ message: "Communication template deleted successfully" });
    } catch (error) {
      console.error("Error deleting communication template:", error);
      res.status(500).json({ message: "Failed to delete communication template" });
    }
  });

  // Communication Messages routes
  app.get("/api/communication-messages/:storeId", isAuthenticated, requirePermission(Permission.VIEW_COMMUNICATIONS), async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const messages = await storage.getCommunicationMessages(storeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching communication messages:", error);
      res.status(500).json({ message: "Failed to fetch communication messages" });
    }
  });

  // Customer Communication Preferences routes
  app.get("/api/customer-communication-preferences/:customerId", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const preferences = await storage.getCustomerCommunicationPreferences(customerId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching customer communication preferences:", error);
      res.status(500).json({ message: "Failed to fetch customer communication preferences" });
    }
  });

  app.post("/api/customer-communication-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const preferences = await storage.createCustomerCommunicationPreferences(req.body);
      res.status(201).json(preferences);
    } catch (error) {
      console.error("Error creating customer communication preferences:", error);
      res.status(500).json({ message: "Failed to create customer communication preferences" });
    }
  });

  app.put("/api/customer-communication-preferences/:customerId", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const preferences = await storage.updateCustomerCommunicationPreferences(customerId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating customer communication preferences:", error);
      res.status(500).json({ message: "Failed to update customer communication preferences" });
    }
  });

  // Appointment Staff Management routes
  app.get("/api/appointments/:id/staff", isAuthenticated, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const staff = await storage.getAppointmentStaff(appointmentId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching appointment staff:", error);
      res.status(500).json({ message: "Failed to fetch appointment staff" });
    }
  });

  app.post("/api/appointments/:id/staff", isAuthenticated, requirePermission(Permission.MANAGE_APPOINTMENTS), async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { staffId } = req.body;
      const assignment = await storage.assignStaffToAppointment(appointmentId, staffId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning staff to appointment:", error);
      res.status(500).json({ message: "Failed to assign staff to appointment" });
    }
  });

  app.delete("/api/appointments/:id/staff/:staffId", isAuthenticated, requirePermission(Permission.MANAGE_APPOINTMENTS), async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const staffId = req.params.staffId;
      await storage.removeStaffFromAppointment(appointmentId, staffId);
      res.json({ message: "Staff removed from appointment successfully" });
    } catch (error) {
      console.error("Error removing staff from appointment:", error);
      res.status(500).json({ message: "Failed to remove staff from appointment" });
    }
  });

  // Send appointment notifications
  app.post("/api/appointments/:id/send-notification", isAuthenticated, requirePermission(Permission.MANAGE_APPOINTMENTS), async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { type, storeId } = req.body; // type: 'confirmation' | 'reminder'
      
      const { sendAppointmentNotification } = await import('./communication-service');
      await sendAppointmentNotification(appointmentId, type, storeId);
      
      res.json({ message: `${type} notification sent successfully` });
    } catch (error) {
      console.error("Error sending appointment notification:", error);
      res.status(500).json({ message: "Failed to send appointment notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
