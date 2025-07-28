import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Create SQLite database
const sqlite = new Database('salon.db');
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'executive',
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    enable_tax BOOLEAN DEFAULT false,
    tax_name TEXT DEFAULT 'GST',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS store_staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    mobile TEXT NOT NULL,
    email TEXT,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    loyalty_points INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS membership_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    points_multiplier INTEGER DEFAULT 1,
    benefits TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS customer_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    membership_plan_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id)
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER,
    category_id INTEGER,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    barcode TEXT UNIQUE,
    category_id INTEGER,
    brand TEXT,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    customer_id INTEGER,
    staff_id TEXT,
    invoice_number TEXT UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    membership_discount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS login_page_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT DEFAULT 'SalonPro',
    logo_url TEXT,
    welcome_message TEXT DEFAULT 'Welcome to SalonPro',
    background_color TEXT DEFAULT '#ffffff',
    primary_color TEXT DEFAULT '#3b82f6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );
`);

// Insert sample data
const insertSampleData = () => {
  try {
    // Insert admin user with correct password hash for 'admin123'
    sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, email, mobile, password, first_name, last_name, role)
      VALUES ('admin_001', 'admin@salon.com', '9876543210', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'super_admin')
    `).run();

    // Insert login page settings
    sqlite.prepare(`
      INSERT OR IGNORE INTO login_page_settings (id, company_name, welcome_message)
      VALUES (1, 'SalonPro', 'Welcome to SalonPro Management System')
    `).run();

    // Insert store
    sqlite.prepare(`
      INSERT OR IGNORE INTO stores (id, name, address, phone, email, enable_tax, tax_rate)
      VALUES (9, 'VeeNails', 'Bhilai', '1234567890', 'info@veenails.com', true, 18.00)
    `).run();

    // Insert sample customer with membership
    sqlite.prepare(`
      INSERT OR IGNORE INTO customers (id, store_id, first_name, last_name, mobile, loyalty_points)
      VALUES (34, 9, 'Kankah', 'Customer', '9876543214', 150)
    `).run();

    // Insert membership plan
    sqlite.prepare(`
      INSERT OR IGNORE INTO membership_plans (id, store_id, name, description, price, discount_percentage, points_multiplier)
      VALUES (29, 9, 'Gold Member', 'Premium membership with 15% discount', 2000.00, 15, 2)
    `).run();

    // Assign membership to customer
    sqlite.prepare(`
      INSERT OR IGNORE INTO customer_memberships (customer_id, membership_plan_id, start_date, is_active)
      VALUES (34, 29, '2025-01-01', true)
    `).run();

    // Insert sample services
    sqlite.prepare(`
      INSERT OR IGNORE INTO services (id, store_id, name, price, duration)
      VALUES 
      (31, 9, 'Acrylic Extension', 1500.00, 120),
      (32, 9, 'Gel Polish', 800.00, 60),
      (33, 9, 'Nail Art', 1200.00, 90)
    `).run();

    // Insert sample products
    sqlite.prepare(`
      INSERT OR IGNORE INTO products (id, store_id, name, price, cost, barcode, stock)
      VALUES 
      (23, 9, 'Essie Base Coat', 450.00, 300.00, '123456789', 50),
      (24, 9, 'OPI Top Coat', 500.00, 350.00, '123456790', 30),
      (25, 9, 'Nail File Set', 200.00, 120.00, '123456791', 100)
    `).run();

    console.log('✅ Sample data inserted successfully');
  } catch (error) {
    console.log('⚠️  Some sample data may already exist:', error.message);
  }
};

insertSampleData();