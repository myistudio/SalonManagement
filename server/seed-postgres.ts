import { db } from './db';
import bcrypt from 'bcrypt';
import {
  users,
  stores,
  customers,
  membershipPlans,
  customerMemberships,
  services,
  products,
  loginPageSettings
} from '@shared/schema';

export async function seedPostgresData() {
  try {
    console.log('Seeding PostgreSQL with sample data...');

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    await db.insert(users).values({
      id: 'admin_001',
      email: 'admin@salon.com',
      mobile: '9876543210',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'super_admin'
    }).onConflictDoNothing();

    // Insert store
    const [store] = await db.insert(stores).values({
      name: 'VeeNails',
      address: 'Bhilai',
      phone: '1234567890',
      email: 'info@veenails.com'
    }).returning();

    // Insert sample customer
    const [customer] = await db.insert(customers).values({
      storeId: store.id,
      firstName: 'Kankah',
      lastName: 'Customer',
      mobile: '9876543214',
      loyaltyPoints: 150
    }).returning();

    // Insert membership plan
    const [membershipPlan] = await db.insert(membershipPlans).values({
      storeId: store.id,
      name: 'Gold Member',
      description: 'Premium membership with great benefits',
      price: 2000,
      durationMonths: 12,
      discountPercentage: 15,
      pointsMultiplier: 2.0,
      benefits: JSON.stringify(['15% discount on all services', 'Priority booking', 'Double points'])
    }).returning();

    // Assign membership to customer
    await db.insert(customerMemberships).values({
      customerId: customer.id,
      membershipPlanId: membershipPlan.id,
      startDate: new Date('2025-01-01'),
      isActive: true
    });

    // Insert services
    await db.insert(services).values([
      {
        storeId: store.id,
        name: 'Acrylic Extension',
        price: 1500,
        duration: 120
      },
      {
        storeId: store.id,
        name: 'Gel Polish',
        price: 800,
        duration: 60
      },
      {
        storeId: store.id,
        name: 'Nail Art',
        price: 1200,
        duration: 90
      }
    ]);

    // Insert products
    await db.insert(products).values([
      {
        storeId: store.id,
        name: 'Essie Base Coat',
        price: 450,
        cost: 300,
        barcode: '123456789',
        stock: 50,
        minStock: 5
      },
      {
        storeId: store.id,
        name: 'OPI Top Coat',
        price: 500,
        cost: 350,
        barcode: '123456790',
        stock: 30,
        minStock: 5
      },
      {
        storeId: store.id,
        name: 'Nail File Set',
        price: 200,
        cost: 120,
        barcode: '123456791',
        stock: 100,
        minStock: 5
      }
    ]);

    // Insert login settings
    await db.insert(loginPageSettings).values({
      companyName: 'SalonPro',
      welcomeMessage: 'Welcome to our Salon Management System',
      footerText: 'Designed by - My Internet'
    }).onConflictDoNothing();

    console.log('✅ PostgreSQL seeded successfully');
    return { store, customer, membershipPlan };
  } catch (error) {
    console.error('❌ PostgreSQL seeding failed:', error);
    throw error;
  }
}