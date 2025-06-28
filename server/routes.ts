import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertCustomerSchema,
  insertServiceSchema,
  insertProductSchema,
  insertMembershipPlanSchema,
  insertTransactionSchema,
  insertTransactionItemSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Store routes
  app.get('/api/stores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'super_admin') {
        const stores = await storage.getStores();
        res.json(stores);
      } else {
        const userStores = await storage.getUserStores(userId);
        res.json(userStores);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
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
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { transaction, items } = req.body;
      const userId = req.user.claims.sub;
      
      // Generate invoice number
      const invoiceNumber = await storage.generateInvoiceNumber(transaction.storeId);
      
      // Validate transaction data
      const transactionData = insertTransactionSchema.parse({
        ...transaction,
        staffId: userId,
        invoiceNumber,
      });
      
      // Validate items
      const itemsData = z.array(insertTransactionItemSchema).parse(items);
      
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
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
