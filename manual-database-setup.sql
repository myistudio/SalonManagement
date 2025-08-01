-- SalonPro Database Manual Setup
-- Run these commands in your PostgreSQL database as salonpro_user

-- 1. Create all tables
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  mobile VARCHAR,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'executive' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  description TEXT,
  gst_number VARCHAR,
  logo_url TEXT,
  enable_tax BOOLEAN DEFAULT true,
  tax_name VARCHAR DEFAULT 'GST',
  tax_rate REAL DEFAULT 18.00,
  is_active BOOLEAN DEFAULT true,
  theme_color VARCHAR DEFAULT '#8B5CF6',
  opening_time VARCHAR DEFAULT '09:00',
  closing_time VARCHAR DEFAULT '18:00',
  slot_duration INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_staff (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  role VARCHAR DEFAULT 'executive' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR,
  mobile VARCHAR NOT NULL,
  email VARCHAR,
  date_of_birth VARCHAR,
  gender VARCHAR,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_plans (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  validity_months INTEGER NOT NULL,
  benefits TEXT,
  discount_percentage REAL DEFAULT 0,
  points_multiplier REAL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_memberships (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  membership_plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  category_id INTEGER REFERENCES service_categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  category_id INTEGER REFERENCES product_categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  cost_price REAL DEFAULT 0,
  barcode VARCHAR,
  sku VARCHAR,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  customer_id INTEGER REFERENCES customers(id),
  customer_name VARCHAR,
  customer_mobile VARCHAR,
  customer_email VARCHAR,
  transaction_type VARCHAR DEFAULT 'sale',
  subtotal REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  payment_method VARCHAR DEFAULT 'cash',
  payment_status VARCHAR DEFAULT 'pending',
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id),
  item_type VARCHAR NOT NULL,
  item_id INTEGER NOT NULL,
  item_name VARCHAR NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  service_staff_id VARCHAR REFERENCES users(id),
  membership_plan_id INTEGER REFERENCES membership_plans(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  customer_name VARCHAR NOT NULL,
  customer_mobile VARCHAR NOT NULL,
  customer_phone VARCHAR,
  customer_email VARCHAR,
  date_of_birth DATE,
  gender VARCHAR,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR NOT NULL,
  service_ids TEXT[] NOT NULL,
  service_name TEXT NOT NULL,
  total_amount DECIMAL NOT NULL,
  duration INTEGER NOT NULL,
  status VARCHAR DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_settings (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  opening_time VARCHAR DEFAULT '09:00',
  closing_time VARCHAR DEFAULT '18:00',
  slot_duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_page_settings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR DEFAULT 'SalonPro',
  logo_url TEXT,
  welcome_message TEXT DEFAULT 'Welcome to your salon management system',
  footer_text TEXT DEFAULT 'Designed by - My Internet',
  primary_color VARCHAR DEFAULT '#8B5CF6',
  background_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Insert initial data

-- Insert default store
INSERT INTO stores (name, address, phone, email, city, state, zip_code, is_active) 
VALUES ('Main Store', '123 Main Street', '+1234567890', 'admin@salonpro.com', 'Your City', 'Your State', '12345', true)
ON CONFLICT DO NOTHING;

-- Insert admin user (password is 'admin123' hashed with bcrypt)
INSERT INTO users (id, email, first_name, last_name, password, role, is_active) 
VALUES ('admin', 'admin@salonpro.com', 'Super', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewNhD/EpE5kxfx.6', 'super_admin', true)
ON CONFLICT DO NOTHING;

-- Insert service categories
INSERT INTO service_categories (store_id, name, description) VALUES 
(1, 'Hair Services', 'All hair-related services'),
(1, 'Nail Services', 'Manicure and pedicure services'),
(1, 'Facial Services', 'Facial treatments and skincare'),
(1, 'Massage Services', 'Relaxation and therapeutic massage')
ON CONFLICT DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (store_id, name, description) VALUES 
(1, 'Hair Products', 'Shampoos, conditioners, styling products'),
(1, 'Nail Products', 'Nail polish, treatments, tools'),
(1, 'Skincare Products', 'Cleansers, moisturizers, treatments'),
(1, 'Tools & Equipment', 'Professional salon tools')
ON CONFLICT DO NOTHING;

-- Insert login page settings
INSERT INTO login_page_settings (company_name, welcome_message, footer_text, primary_color) 
VALUES ('SalonPro', 'Welcome to your salon management system', 'Designed by - My Internet', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Insert default appointment settings
INSERT INTO appointment_settings (store_id, opening_time, closing_time, slot_duration, is_active) 
VALUES (1, '09:00', '18:00', 30, true)
ON CONFLICT DO NOTHING;