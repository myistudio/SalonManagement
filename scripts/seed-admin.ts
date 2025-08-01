#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from '../shared/schema.js';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function seedAdmin() {
  try {
    console.log('🌱 Starting admin seeding...');

    // Create default store
    console.log('📍 Creating default store...');
    const [defaultStore] = await db
      .insert(schema.stores)
      .values({
        name: 'Main Store',
        address: '123 Main Street',
        phone: '+1234567890',
        email: 'admin@salonpro.com',
        city: 'Your City',
        state: 'Your State',
        zipCode: '12345',
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (defaultStore) {
      console.log('✅ Default store created:', defaultStore.name);
    } else {
      console.log('ℹ️ Default store already exists');
      // Get existing store
      const [existingStore] = await db
        .select()
        .from(schema.stores)
        .where(eq(schema.stores.name, 'Main Store'))
        .limit(1);
      
      if (existingStore) {
        console.log('✅ Using existing store:', existingStore.name);
      }
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        id: 'admin',
        email: 'admin@salonpro.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (adminUser) {
      console.log('✅ Admin user created with credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@salonpro.com');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create basic service categories
    console.log('📂 Creating service categories...');
    const categories = [
      { name: 'Hair Services', description: 'All hair-related services' },
      { name: 'Nail Services', description: 'Manicure and pedicure services' },
      { name: 'Facial Services', description: 'Facial treatments and skincare' },
      { name: 'Massage Services', description: 'Relaxation and therapeutic massage' },
    ];

    for (const category of categories) {
      try {
        await db
          .insert(schema.serviceCategories)
          .values({
            name: category.name,
            description: category.description,
            storeId: 1 // Default store ID
          })
          .onConflictDoNothing();
        console.log(`✅ Category created: ${category.name}`);
      } catch (error) {
        console.log(`ℹ️ Category already exists: ${category.name}`);
      }
    }

    // Create basic product categories
    console.log('📦 Creating product categories...');
    const productCategories = [
      { name: 'Hair Products', description: 'Shampoos, conditioners, styling products' },
      { name: 'Nail Products', description: 'Nail polish, treatments, tools' },
      { name: 'Skincare Products', description: 'Cleansers, moisturizers, treatments' },
      { name: 'Tools & Equipment', description: 'Professional salon tools' },
    ];

    for (const category of productCategories) {
      try {
        await db
          .insert(schema.productCategories)
          .values({
            name: category.name,
            description: category.description,
            storeId: 1 // Default store ID
          })
          .onConflictDoNothing();
        console.log(`✅ Product category created: ${category.name}`);
      } catch (error) {
        console.log(`ℹ️ Product category already exists: ${category.name}`);
      }
    }

    console.log('\n🎉 Admin seeding completed successfully!');
    console.log('\n📋 Quick Start:');
    console.log('1. Start your application: npm start');
    console.log('2. Open your browser and navigate to your app');
    console.log('3. Login with: admin / admin123');
    console.log('4. Change the admin password after first login');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
seedAdmin();