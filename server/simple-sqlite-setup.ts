import { db } from './db-sqlite';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

export async function setupSimpleSQLite() {
  try {
    console.log('Setting up minimal SQLite database...');

    // Create the essential tables with correct column names
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

    console.log('✅ Tables created successfully');

    // Hash password and insert admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.run(sql`
      INSERT OR REPLACE INTO users (id, email, mobile, first_name, last_name, password, role)
      VALUES ('admin_001', 'admin@salon.com', '9876543210', 'Admin', 'User', ${hashedPassword}, 'super_admin')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO stores (id, name, address, phone, email)
      VALUES (1, 'VeeNails', 'Bhilai', '9876543210', 'info@veenails.com')
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO customers (id, store_id, first_name, mobile, loyalty_points)
      VALUES (1, 1, 'Kankah', '9876543214', 150)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO membership_plans (id, store_id, name, description, price, duration_months, discount_percentage)
      VALUES (1, 1, 'Gold Member', 'Premium membership', 2000, 12, 15)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO customer_memberships (customer_id, membership_plan_id, start_date, is_active)
      VALUES (1, 1, '2025-01-01', 1)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO services (id, store_id, name, price, duration)
      VALUES 
        (1, 1, 'Acrylic Extension', 1500, 120),
        (2, 1, 'Gel Polish', 800, 60),
        (3, 1, 'Nail Art', 1200, 90)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO products (id, store_id, name, price, cost, barcode, stock)
      VALUES 
        (1, 1, 'Essie Base Coat', 450, 300, '123456789', 50),
        (2, 1, 'OPI Top Coat', 500, 350, '123456790', 30),
        (3, 1, 'Nail File Set', 200, 120, '123456791', 100)
    `);

    await db.run(sql`
      INSERT OR REPLACE INTO login_page_settings (id, company_name)
      VALUES (1, 'SalonPro')
    `);

    console.log('✅ SQLite database setup complete');
    console.log('🔑 Admin credentials: admin@salon.com / admin123');

    return true;
  } catch (error) {
    console.error('❌ SQLite setup failed:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupSimpleSQLite().catch(console.error);
}