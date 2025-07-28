import { db } from './db-sqlite';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

export async function setupCompleteSQLite() {
  try {
    console.log('Setting up complete SQLite database...');

    // Create all tables with correct schema
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        mobile TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'executive' NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        phone TEXT,
        email TEXT,
        description TEXT,
        gst_number TEXT,
        logo_url TEXT,
        enable_tax INTEGER DEFAULT 1,
        tax_name TEXT DEFAULT 'GST',
        tax_rate REAL DEFAULT 18.00,
        is_active INTEGER DEFAULT 1,
        theme_color TEXT DEFAULT '#8B5CF6',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS store_staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT DEFAULT 'executive' NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        first_name TEXT NOT NULL,
        last_name TEXT,
        mobile TEXT NOT NULL,
        email TEXT,
        date_of_birth TEXT,
        gender TEXT,
        address TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_visits INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        duration_months INTEGER NOT NULL,
        discount_percentage REAL DEFAULT 0,
        points_multiplier REAL DEFAULT 1.0,
        benefits TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS customer_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        membership_plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        duration INTEGER DEFAULT 60,
        category_id INTEGER,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        cost REAL DEFAULT 0,
        barcode TEXT,
        category_id INTEGER,
        brand TEXT,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS service_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS product_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        customer_id INTEGER REFERENCES customers(id),
        invoice_number TEXT UNIQUE NOT NULL,
        subtotal REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'Cash',
        staff_id TEXT REFERENCES users(id),
        points_earned INTEGER DEFAULT 0,
        points_redeemed INTEGER DEFAULT 0,
        membership_discount REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL REFERENCES transactions(id),
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        service_staff_id TEXT REFERENCES users(id),
        membership_plan_id INTEGER REFERENCES membership_plans(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS login_page_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT DEFAULT 'SalonPro',
        logo_url TEXT,
        primary_color TEXT DEFAULT '#8B5CF6',
        secondary_color TEXT DEFAULT '#EC4899',
        welcome_message TEXT DEFAULT 'Welcome to our Salon Management System',
        footer_text TEXT DEFAULT 'Designed by - My Internet',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ All tables created successfully');

    // Create sample data with proper types
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.run(sql`
      INSERT OR REPLACE INTO users (id, email, mobile, first_name, last_name, password, role)
      VALUES ('admin_001', 'admin@salon.com', '9876543210', 'Admin', 'User', ${hashedPassword}, 'super_admin')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO stores (id, name, address, phone, email, description)
      VALUES (1, 'VeeNails Premium', 'Bhilai, Chhattisgarh', '9876543210', 'info@veenails.com', 'Premium nail salon')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO store_staff (store_id, user_id, role)
      VALUES (1, 'admin_001', 'super_admin')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO customers (id, store_id, first_name, last_name, mobile, loyalty_points)
      VALUES (1, 1, 'Kankah', 'Patel', '9876543214', 250)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO membership_plans (id, store_id, name, description, price, duration_months, discount_percentage, points_multiplier)
      VALUES (1, 1, 'Gold Member', 'Premium membership with 15% discount', 2500, 12, 15, 2.0)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO customer_memberships (customer_id, membership_plan_id, start_date, is_active)
      VALUES (1, 1, '2025-01-01', 1)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO service_categories (id, store_id, name, description)
      VALUES 
        (1, 1, 'Nail Extensions', 'Professional nail extension services'),
        (2, 1, 'Nail Art', 'Creative nail art designs'),
        (3, 1, 'Basic Care', 'Basic nail care services')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO product_categories (id, store_id, name, description)
      VALUES 
        (1, 1, 'Base & Top Coats', 'Foundation and finishing products'),
        (2, 1, 'Nail Polish', 'Color nail polish collection'),
        (3, 1, 'Tools & Accessories', 'Nail care tools and accessories')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO services (id, store_id, name, description, price, duration, category_id)
      VALUES 
        (1, 1, 'Acrylic Extension', 'Professional acrylic nail extensions', 1800, 120, 1),
        (2, 1, 'Gel Polish', 'Long-lasting gel polish application', 900, 60, 3),
        (3, 1, 'Nail Art Design', 'Custom nail art designs', 1500, 90, 2)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO products (id, store_id, name, description, price, cost, barcode, stock, min_stock, category_id)
      VALUES 
        (1, 1, 'Essie Base Coat', 'Professional base coat for long-lasting manicures', 450, 280, '123456789011', 45, 5, 1),
        (2, 1, 'OPI Top Coat', 'High-shine protective top coat', 520, 320, '123456789012', 38, 5, 1),
        (3, 1, 'Nail File Set', 'Professional nail filing set', 280, 150, '123456789013', 120, 10, 3)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO login_page_settings (id, company_name, welcome_message)
      VALUES (1, 'SalonPro Management System', 'Welcome to your professional salon management platform')
    `);

    console.log('✅ Complete SQLite database setup successful!');
    console.log('🔑 Admin credentials: admin@salon.com / admin123');
    console.log('📊 Sample data created for all sections');

    return true;
  } catch (error) {
    console.error('❌ SQLite setup failed:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupCompleteSQLite().catch(console.error);
}