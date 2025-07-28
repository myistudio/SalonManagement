import { db } from './db-sqlite';
import bcrypt from 'bcrypt';
import {
  users,
  stores,
  customers,
  membershipPlans,
  customerMemberships,
  services,
  products,
  loginPageSettings,
  storeStaff,
  transactions,
  transactionItems
} from '@shared/schema-sqlite';

export async function flushAndSeed() {
  try {
    console.log('Creating SQLite database and seeding with comprehensive data...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const executivePassword = await bcrypt.hash('executive123', 10);

    // Insert users first
    const adminUser = await db.insert(users).values({
      id: 'admin_001',
      email: 'admin@salon.com',
      mobile: '9876543210',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'super_admin'
    }).returning();

    const managerUser = await db.insert(users).values({
      id: 'manager_001',
      email: 'manager@salon.com',
      mobile: '9876543211',
      firstName: 'Store',
      lastName: 'Manager',
      password: managerPassword,
      role: 'store_manager'
    }).returning();

    const executiveUser = await db.insert(users).values({
      id: 'executive_001',
      email: 'executive@salon.com',
      mobile: '9876543212',
      firstName: 'Store',
      lastName: 'Executive',
      password: executivePassword,
      role: 'executive'
    }).returning();

    // Insert store
    const [store] = await db.insert(stores).values({
      name: 'VeeNails Premium',
      address: 'Supela, Bhilai, Chhattisgarh',
      city: 'Bhilai',
      state: 'Chhattisgarh',
      zipCode: '490023',
      phone: '9876543210',
      email: 'info@veenails.com',
      description: 'Premium nail studio and beauty salon',
      gstNumber: 'GST123456789',
      enableTax: true,
      taxName: 'GST',
      taxRate: 18.00,
      themeColor: '#8B5CF6'
    }).returning();

    // Link staff to store
    await db.insert(storeStaff).values([
      {
        storeId: store.id,
        userId: managerUser[0].id,
        role: 'store_manager'
      },
      {
        storeId: store.id,
        userId: executiveUser[0].id,
        role: 'executive'
      }
    ]);

    // Insert membership plans
    const [goldPlan] = await db.insert(membershipPlans).values({
      storeId: store.id,
      name: 'Gold Member',
      description: 'Premium membership with exclusive benefits',
      price: 2500,
      durationMonths: 12,
      discountPercentage: 15,
      pointsMultiplier: 2.0,
      benefits: JSON.stringify([
        '15% discount on all services',
        'Priority booking',
        'Double loyalty points',
        'Free nail art once a month'
      ])
    }).returning();

    const [silverPlan] = await db.insert(membershipPlans).values({
      storeId: store.id,
      name: 'Silver Member',
      description: 'Great value membership',
      price: 1500,
      durationMonths: 6,
      discountPercentage: 10,
      pointsMultiplier: 1.5,
      benefits: JSON.stringify([
        '10% discount on all services',
        '50% more loyalty points',
        'Birthday special discount'
      ])
    }).returning();

    // Insert customers
    const [customer1] = await db.insert(customers).values({
      storeId: store.id,
      firstName: 'Kankah',
      lastName: 'Patel',
      mobile: '9876543214',
      email: 'kankah@example.com',
      dateOfBirth: new Date('1995-03-15'),
      gender: 'Female',
      loyaltyPoints: 250,
      totalVisits: 8,
      totalSpent: 12500
    }).returning();

    const [customer2] = await db.insert(customers).values({
      storeId: store.id,
      firstName: 'Priya',
      lastName: 'Sharma',
      mobile: '9876543215',
      email: 'priya@example.com',
      dateOfBirth: new Date('1992-07-20'),
      gender: 'Female',
      loyaltyPoints: 180,
      totalVisits: 5,
      totalSpent: 8900
    }).returning();

    // Assign memberships
    await db.insert(customerMemberships).values([
      {
        customerId: customer1.id,
        membershipPlanId: goldPlan.id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true
      },
      {
        customerId: customer2.id,
        membershipPlanId: silverPlan.id,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-07-15'),
        isActive: true
      }
    ]);

    // Insert services
    await db.insert(services).values([
      {
        storeId: store.id,
        name: 'Acrylic Extension',
        description: 'Premium acrylic nail extensions',
        price: 1800,
        duration: 120,
        categoryId: 1
      },
      {
        storeId: store.id,
        name: 'Gel Polish',
        description: 'Long-lasting gel polish application',
        price: 900,
        duration: 60,
        categoryId: 1
      },
      {
        storeId: store.id,
        name: 'Nail Art Design',
        description: 'Custom nail art and designs',
        price: 1500,
        duration: 90,
        categoryId: 1
      },
      {
        storeId: store.id,
        name: 'Manicure & Pedicure',
        description: 'Complete mani-pedi service',
        price: 1200,
        duration: 75,
        categoryId: 2
      },
      {
        storeId: store.id,
        name: 'Nail Extension Removal',
        description: 'Safe removal of nail extensions',
        price: 500,
        duration: 45,
        categoryId: 3
      }
    ]);

    // Insert products
    await db.insert(products).values([
      {
        storeId: store.id,
        name: 'Essie Base Coat',
        description: 'Professional base coat for nail polish',
        price: 450,
        cost: 280,
        barcode: '123456789011',
        categoryId: 1,
        brand: 'Essie',
        stock: 45,
        minStock: 5
      },
      {
        storeId: store.id,
        name: 'OPI Top Coat',
        description: 'High-shine protective top coat',
        price: 520,
        cost: 320,
        barcode: '123456789012',
        categoryId: 1,
        brand: 'OPI',
        stock: 38,
        minStock: 5
      },
      {
        storeId: store.id,
        name: 'Professional Nail File Set',
        description: 'Set of 5 professional nail files',
        price: 280,
        cost: 150,
        barcode: '123456789013',
        categoryId: 2,
        brand: 'Generic',
        stock: 120,
        minStock: 10
      },
      {
        storeId: store.id,
        name: 'Cuticle Oil',
        description: 'Nourishing cuticle oil',
        price: 350,
        cost: 200,
        barcode: '123456789014',
        categoryId: 3,
        brand: 'CND',
        stock: 65,
        minStock: 8
      },
      {
        storeId: store.id,
        name: 'Hand Cream Luxury',
        description: 'Premium moisturizing hand cream',
        price: 650,
        cost: 380,
        barcode: '123456789015',
        categoryId: 3,
        brand: 'L\'Occitane',
        stock: 25,
        minStock: 5
      }
    ]);

    // Insert sample transactions
    const [transaction1] = await db.insert(transactions).values({
      storeId: store.id,
      customerId: customer1.id,
      invoiceNumber: 'INV-2025-001',
      subtotal: 2700,
      discountAmount: 405, // 15% discount
      taxAmount: 413.1, // 18% on discounted amount
      totalAmount: 2708.1,
      paymentMethod: 'UPI',
      staffId: executiveUser[0].id,
      pointsEarned: 54,
      pointsRedeemed: 0,
      membershipDiscount: 405
    }).returning();

    await db.insert(transactionItems).values([
      {
        transactionId: transaction1.id,
        itemType: 'service',
        itemId: 1,
        itemName: 'Acrylic Extension',
        quantity: 1,
        unitPrice: 1800,
        totalPrice: 1800,
        serviceStaffId: executiveUser[0].id
      },
      {
        transactionId: transaction1.id,
        itemType: 'service',
        itemId: 3,
        itemName: 'Nail Art Design',
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500,
        serviceStaffId: executiveUser[0].id
      },
      {
        transactionId: transaction1.id,
        itemType: 'product',
        itemId: 1,
        itemName: 'Essie Base Coat',
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450
      }
    ]);

    // Insert login page settings
    await db.insert(loginPageSettings).values({
      companyName: 'SalonPro Management System',
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      welcomeMessage: 'Welcome to our Professional Salon Management System',
      footerText: 'Designed by - My Internet'
    });

    console.log('✅ SQLite database seeded successfully with comprehensive data');
    console.log('🔑 Login credentials:');
    console.log('   Admin: admin@salon.com / admin123');
    console.log('   Manager: manager@salon.com / manager123');
    console.log('   Executive: executive@salon.com / executive123');

    return { store, customer1, customer2, goldPlan, silverPlan };
  } catch (error) {
    console.error('❌ SQLite seeding failed:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  flushAndSeed().catch(console.error);
}