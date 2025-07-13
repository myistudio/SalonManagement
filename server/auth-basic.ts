import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

export function setupBasicAuth(app: Express) {
  // Session configuration
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // Table already exists
    ttl: 7 * 24 * 60 * 60, // 1 week
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/mobile + password
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'login', // Can be email or mobile
        passwordField: 'password',
      },
      async (login, password, done) => {
        try {
          // Try to find user by email or mobile
          const user = await storage.getUserByEmailOrMobile(login);
          if (!user || !user.password) {
            return done(null, false, { message: 'Invalid login credentials' });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: 'Invalid login credentials' });
          }

          return done(null, user);
        } catch (error) {
          console.error('Login error:', error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, mobile, password, firstName, lastName } = req.body;
      
      if (!email && !mobile) {
        return res.status(400).json({ message: "Email or mobile number is required" });
      }
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      if (!firstName) {
        return res.status(400).json({ message: "First name is required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmailOrMobile(email || mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email or mobile" });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const user = await storage.createUser({
        id: userId,
        email: email || null,
        mobile: mobile || null,
        password: hashedPassword,
        firstName,
        lastName: lastName || null,
        profileImageUrl: null,
        role: 'cashier', // Default role
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  });
}

// Middleware to check authentication
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        message: "Access denied. Insufficient permissions.",
        requiredRole: allowedRoles,
        userRole: user.role
      });
    }

    next();
  };
};

// Check if user has access to specific store
export const hasStoreAccess = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Super admins have access to all stores
    if (user.role === 'super_admin') {
      return next();
    }

    // Get store ID from params, query, or body
    const storeId = parseInt(req.params.storeId || req.query.storeId || req.body.storeId);
    if (!storeId) {
      return res.status(400).json({ message: "Store ID is required" });
    }

    // Check if user is assigned to this store
    const userStores = await storage.getUserStores(user.id);
    const hasAccess = userStores.some((store: any) => store.id === storeId);

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied to this store",
        storeId: storeId,
        userStores: userStores.map((s: any) => s.id)
      });
    }

    next();
  } catch (error) {
    console.error("Store access check error:", error);
    res.status(500).json({ message: "Failed to verify store access" });
  }
};

// Comprehensive permission system
export const Permission = {
  // Super Admin permissions
  MANAGE_ALL_STORES: 'manage_all_stores',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  MANAGE_ALL_STAFF: 'manage_all_staff',
  VIEW_ALL_REPORTS: 'view_all_reports',
  
  // Store Manager permissions
  MANAGE_STORE_SETTINGS: 'manage_store_settings',
  MANAGE_STORE_STAFF: 'manage_store_staff',
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_SERVICES: 'manage_services',
  MANAGE_CUSTOMERS: 'manage_customers',
  MANAGE_MEMBERSHIPS: 'manage_memberships',
  VIEW_STORE_REPORTS: 'view_store_reports',
  MANAGE_APPOINTMENTS: 'manage_appointments',
  
  // Cashier/Executive permissions
  CREATE_BILLS: 'create_bills',
  MANAGE_TRANSACTIONS: 'manage_transactions',
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CUSTOMERS: 'create_customers',
  VIEW_INVENTORY: 'view_inventory',
  VIEW_SERVICES: 'view_services',
  BOOK_APPOINTMENTS: 'book_appointments',
};

// Permission mapping for each role
const rolePermissions = {
  super_admin: [
    Permission.MANAGE_ALL_STORES,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.MANAGE_ALL_STAFF,
    Permission.VIEW_ALL_REPORTS,
    Permission.MANAGE_STORE_SETTINGS,
    Permission.MANAGE_STORE_STAFF,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_SERVICES,
    Permission.MANAGE_CUSTOMERS,
    Permission.MANAGE_MEMBERSHIPS,
    Permission.VIEW_STORE_REPORTS,
    Permission.MANAGE_APPOINTMENTS,
    Permission.CREATE_BILLS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_SERVICES,
    Permission.BOOK_APPOINTMENTS,
  ],
  store_manager: [
    Permission.MANAGE_STORE_SETTINGS,
    Permission.MANAGE_STORE_STAFF,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_SERVICES,
    Permission.MANAGE_CUSTOMERS,
    Permission.MANAGE_MEMBERSHIPS,
    Permission.VIEW_STORE_REPORTS,
    Permission.MANAGE_APPOINTMENTS,
    Permission.CREATE_BILLS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_SERVICES,
    Permission.BOOK_APPOINTMENTS,
  ],
  executive: [
    Permission.CREATE_BILLS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_SERVICES,
    Permission.BOOK_APPOINTMENTS,
  ],
};

// Check if user has specific permission
export const hasPermission = (req: any, res: any, permission: string, next: any) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userPermissions = rolePermissions[user.role as keyof typeof rolePermissions] || [];
  if (!userPermissions.includes(permission)) {
    return res.status(403).json({ 
      message: "Access denied. Insufficient permissions.",
      requiredPermission: permission,
      userRole: user.role
    });
  }

  next();
};

// Middleware factory for permission checking
export const requirePermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    hasPermission(req, res, permission, next);
  };
};