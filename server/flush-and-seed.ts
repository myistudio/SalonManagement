import { db } from './db';
import { 
  users, 
  stores, 
  storeStaff, 
  customers, 
  services, 
  serviceCategories,
  products, 
  productCategories,
  transactions, 
  transactionItems,
  membershipPlans,
  customerMemberships,
  loyaltySettings,
  whatsappSettings,
  whatsappTemplates,
  whatsappMessages,
  customerCampaigns,
  loginPageSettings,
  appointments
} from '../shared/schema';

async function flushDatabase() {
  console.log('🗑️  Flushing database...');
  
  // Delete in reverse order of dependencies
  await db.delete(whatsappMessages);
  await db.delete(customerCampaigns);
  await db.delete(whatsappTemplates);
  await db.delete(whatsappSettings);
  await db.delete(transactionItems);
  await db.delete(transactions);
  await db.delete(customerMemberships);
  await db.delete(membershipPlans);
  await db.delete(loyaltySettings);
  await db.delete(products);
  await db.delete(productCategories);
  await db.delete(services);
  await db.delete(serviceCategories);
  await db.delete(customers);
  await db.delete(appointments);
  await db.delete(storeStaff);
  await db.delete(stores);
  await db.delete(users);
  await db.delete(loginPageSettings);
  
  console.log('✅ Database flushed successfully');
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // Create super admin user
  const [superAdmin] = await db.insert(users).values({
    id: 'admin_001',
    email: 'admin@salon.com',
    mobile: '9876543210',
    password: '$2b$10$8K1p/a0dClAo/HzTbNKTYOzHjJzjGZFW9JgFH2fVKXpBzJVQSJzC.',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    isActive: true
  }).returning();

  // Create store managers
  const [manager1] = await db.insert(users).values({
    id: 'manager_001',
    email: 'manager1@salon.com',
    mobile: '9876543211',
    password: '$2b$10$8K1p/a0dClAo/HzTbNKTYOzHjJzjGZFW9JgFH2fVKXpBzJVQSJzC.',
    firstName: 'John',
    lastName: 'Manager',
    role: 'store_manager',
    isActive: true
  }).returning();

  const [manager2] = await db.insert(users).values({
    id: 'manager_002',
    email: 'manager2@salon.com',
    mobile: '9876543212',
    password: '$2b$10$8K1p/a0dClAo/HzTbNKTYOzHjJzjGZFW9JgFH2fVKXpBzJVQSJzC.',
    firstName: 'Sarah',
    lastName: 'Smith',
    role: 'store_manager',
    isActive: true
  }).returning();

  // Create executives
  const [executive1] = await db.insert(users).values({
    id: 'executive_001',
    email: 'executive1@salon.com',
    mobile: '9876543213',
    password: '$2b$10$8K1p/a0dClAo/HzTbNKTYOzHjJzjGZFW9JgFH2fVKXpBzJVQSJzC.',
    firstName: 'Mike',
    lastName: 'Executive',
    role: 'executive',
    isActive: true
  }).returning();

  const [executive2] = await db.insert(users).values({
    id: 'executive_002',
    email: 'executive2@salon.com',
    mobile: '9876543214',
    password: '$2b$10$8K1p/a0dClAo/HzTbNKTYOzHjJzjGZFW9JgFH2fVKXpBzJVQSJzC.',
    firstName: 'Emma',
    lastName: 'Johnson',
    role: 'executive',
    isActive: true
  }).returning();

  // Create stores
  const [store1] = await db.insert(stores).values({
    name: 'VEEPRESS',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    phone: '02212345678',
    email: 'veepress@salon.com',
    description: 'Premium beauty salon and spa',
    gstNumber: '27ABCDE1234F1Z5',
    isActive: true,
    themeColor: '#8B5CF6'
  }).returning();

  const [store2] = await db.insert(stores).values({
    name: 'Elite Nail Studio',
    address: '456 Beauty Lane',
    city: 'Delhi',
    state: 'Delhi',
    zipCode: '110001',
    phone: '01123456789',
    email: 'elite@salon.com',
    description: 'Specialized nail art and manicure studio',
    gstNumber: '07ABCDE1234F1Z5',
    isActive: true,
    themeColor: '#EC4899'
  }).returning();

  // Assign staff to stores
  await db.insert(storeStaff).values([
    { storeId: store1.id, userId: manager1.id, role: 'store_manager' },
    { storeId: store1.id, userId: executive1.id, role: 'executive' },
    { storeId: store2.id, userId: manager2.id, role: 'store_manager' },
    { storeId: store2.id, userId: executive2.id, role: 'executive' }
  ]);

  // Create service categories
  const [facialCategory] = await db.insert(serviceCategories).values({
    storeId: store1.id,
    name: 'Facial Treatments',
    description: 'Professional facial treatments',
    isActive: true
  }).returning();

  const [nailCategory] = await db.insert(serviceCategories).values({
    storeId: store1.id,
    name: 'Nail Services',
    description: 'Manicure and pedicure services',
    isActive: true
  }).returning();

  const [hairCategory] = await db.insert(serviceCategories).values({
    storeId: store1.id,
    name: 'Hair Services',
    description: 'Hair cutting and styling',
    isActive: true
  }).returning();

  // Create services
  await db.insert(services).values([
    {
      storeId: store1.id,
      name: 'Deep Cleansing Facial',
      description: 'Professional deep cleansing facial treatment',
      price: '1500.00',
      duration: 60,
      category: facialCategory.name,
      categoryId: facialCategory.id,
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'Anti-Aging Facial',
      description: 'Anti-aging facial with premium products',
      price: '2500.00',
      duration: 90,
      category: facialCategory.name,
      categoryId: facialCategory.id,
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'Classic Manicure',
      description: 'Basic nail care and polish',
      price: '800.00',
      duration: 45,
      category: nailCategory.name,
      categoryId: nailCategory.id,
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'Gel Manicure',
      description: 'Long-lasting gel nail polish',
      price: '1200.00',
      duration: 60,
      category: nailCategory.name,
      categoryId: nailCategory.id,
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'Hair Cut & Style',
      description: 'Professional hair cut and styling',
      price: '1000.00',
      duration: 75,
      category: hairCategory.name,
      categoryId: hairCategory.id,
      isActive: true
    }
  ]);

  // Create product categories
  const [skincareCategory] = await db.insert(productCategories).values({
    storeId: store1.id,
    name: 'Skincare',
    description: 'Skincare products and treatments',
    isActive: true
  }).returning();

  const [nailProductCategory] = await db.insert(productCategories).values({
    storeId: store1.id,
    name: 'Nail Products',
    description: 'Nail polish and care products',
    isActive: true
  }).returning();

  // Create products
  await db.insert(products).values([
    {
      storeId: store1.id,
      name: 'Vitamin C Serum',
      description: 'Anti-aging vitamin C serum',
      price: '2500.00',
      stock: 25,
      lowStockThreshold: 5,
      category: skincareCategory.name,
      categoryId: skincareCategory.id,
      barcode: '1234567890123',
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'Essie Base Coat',
      description: 'Professional nail base coat',
      price: '450.00',
      stock: 15,
      lowStockThreshold: 3,
      category: nailProductCategory.name,
      categoryId: nailProductCategory.id,
      barcode: '1234567890124',
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'OPI Nail Polish - Red',
      description: 'Premium red nail polish',
      price: '650.00',
      stock: 30,
      lowStockThreshold: 5,
      category: nailProductCategory.name,
      categoryId: nailProductCategory.id,
      barcode: '1234567890125',
      isActive: true
    }
  ]);

  // Create customers
  const [customer1] = await db.insert(customers).values({
    storeId: store1.id,
    firstName: 'Priya',
    lastName: 'Sharma',
    mobile: '9876543220',
    email: 'priya@example.com',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'Female',
    address: '789 Customer Street, Mumbai',
    loyaltyPoints: 250,
    totalVisits: 5,
    totalSpent: '7500.00'
  }).returning();

  const [customer2] = await db.insert(customers).values({
    storeId: store1.id,
    firstName: 'Rahul',
    lastName: 'Patel',
    mobile: '9876543221',
    email: 'rahul@example.com',
    dateOfBirth: new Date('1985-08-22'),
    gender: 'Male',
    address: '321 Client Avenue, Mumbai',
    loyaltyPoints: 150,
    totalVisits: 3,
    totalSpent: '4500.00'
  }).returning();

  const [customer3] = await db.insert(customers).values({
    storeId: store1.id,
    firstName: 'Anita',
    lastName: 'Singh',
    mobile: '9876543222',
    email: 'anita@example.com',
    dateOfBirth: new Date('1992-12-03'),
    gender: 'Female',
    address: '654 Beauty Road, Mumbai',
    loyaltyPoints: 500,
    totalVisits: 8,
    totalSpent: '12000.00'
  }).returning();

  // Create membership plans
  const [goldPlan] = await db.insert(membershipPlans).values({
    storeId: store1.id,
    name: 'Gold Membership',
    description: 'Premium membership with 20% discount',
    price: '5000.00',
    discountPercentage: '20.00',
    validityDays: 365,
    benefits: ['20% discount on all services', 'Priority booking', 'Complimentary beverages'],
    isActive: true
  }).returning();

  const [silverPlan] = await db.insert(membershipPlans).values({
    storeId: store1.id,
    name: 'Silver Membership',
    description: 'Standard membership with 15% discount',
    price: '3000.00',
    discountPercentage: '15.00',
    validityDays: 365,
    benefits: ['15% discount on all services', 'Priority booking'],
    isActive: true
  }).returning();

  // Assign memberships to customers
  await db.insert(customerMemberships).values([
    {
      customerId: customer1.id,
      membershipPlanId: goldPlan.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true
    },
    {
      customerId: customer3.id,
      membershipPlanId: silverPlan.id,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      isActive: true
    }
  ]);

  // Create loyalty settings
  await db.insert(loyaltySettings).values({
    storeId: store1.id,
    pointsPerRupee: '0.01',
    rupeesPerPoint: '1.00',
    minRedemptionPoints: 100,
    maxRedemptionPercentage: '50.00'
  });

  // Create actual transactions with realistic data
  const transactions_data = [
    {
      storeId: store1.id,
      customerId: customer1.id,
      staffId: executive1.id,
      invoiceNumber: 'INV-2024-001',
      subtotal: '1500.00',
      discountAmount: '300.00', // 20% gold membership discount
      taxAmount: '216.00', // 18% GST
      totalAmount: '1416.00',
      paymentMethod: 'upi',
      pointsEarned: 14,
      pointsRedeemed: 0,
      membershipDiscount: '300.00',
      notes: 'Gold membership discount applied'
    },
    {
      storeId: store1.id,
      customerId: customer2.id,
      staffId: executive1.id,
      invoiceNumber: 'INV-2024-002',
      subtotal: '2000.00',
      discountAmount: '0.00',
      taxAmount: '360.00',
      totalAmount: '2360.00',
      paymentMethod: 'card',
      pointsEarned: 24,
      pointsRedeemed: 0,
      membershipDiscount: '0.00',
      notes: 'Walk-in customer'
    },
    {
      storeId: store1.id,
      customerId: customer3.id,
      staffId: executive2.id,
      invoiceNumber: 'INV-2024-003',
      subtotal: '3000.00',
      discountAmount: '450.00', // 15% silver membership discount
      taxAmount: '459.00',
      totalAmount: '3009.00',
      paymentMethod: 'cash',
      pointsEarned: 30,
      pointsRedeemed: 0,
      membershipDiscount: '450.00',
      notes: 'Silver membership discount applied'
    },
    {
      storeId: store1.id,
      customerId: customer1.id,
      staffId: executive1.id,
      invoiceNumber: 'INV-2024-004',
      subtotal: '1800.00',
      discountAmount: '360.00',
      taxAmount: '259.20',
      totalAmount: '1699.20',
      paymentMethod: 'upi',
      pointsEarned: 17,
      pointsRedeemed: 0,
      membershipDiscount: '360.00',
      notes: 'Gold membership discount applied'
    },
    {
      storeId: store1.id,
      customerId: null, // Walk-in customer
      staffId: executive2.id,
      invoiceNumber: 'INV-2024-005',
      subtotal: '800.00',
      discountAmount: '0.00',
      taxAmount: '144.00',
      totalAmount: '944.00',
      paymentMethod: 'cash',
      pointsEarned: 0,
      pointsRedeemed: 0,
      membershipDiscount: '0.00',
      notes: 'Walk-in customer - no loyalty points'
    }
  ];

  // Insert transactions
  for (const transactionData of transactions_data) {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    
    // Add transaction items based on the transaction
    if (transaction.invoiceNumber === 'INV-2024-001') {
      await db.insert(transactionItems).values({
        transactionId: transaction.id,
        itemType: 'service',
        itemId: 1,
        itemName: 'Deep Cleansing Facial',
        quantity: 1,
        unitPrice: '1500.00',
        totalPrice: '1500.00',
        serviceStaffId: manager1.id
      });
    } else if (transaction.invoiceNumber === 'INV-2024-002') {
      await db.insert(transactionItems).values([
        {
          transactionId: transaction.id,
          itemType: 'service',
          itemId: 2,
          itemName: 'Classic Manicure',
          quantity: 1,
          unitPrice: '800.00',
          totalPrice: '800.00',
          serviceStaffId: manager1.id
        },
        {
          transactionId: transaction.id,
          itemType: 'service',
          itemId: 3,
          itemName: 'Gel Manicure',
          quantity: 1,
          unitPrice: '1200.00',
          totalPrice: '1200.00',
          serviceStaffId: manager1.id
        }
      ]);
    } else if (transaction.invoiceNumber === 'INV-2024-003') {
      await db.insert(transactionItems).values([
        {
          transactionId: transaction.id,
          itemType: 'service',
          itemId: 4,
          itemName: 'Anti-Aging Facial',
          quantity: 1,
          unitPrice: '2500.00',
          totalPrice: '2500.00',
          serviceStaffId: manager2.id
        },
        {
          transactionId: transaction.id,
          itemType: 'product',
          itemId: 1,
          itemName: 'Vitamin C Serum',
          quantity: 1,
          unitPrice: '500.00',
          totalPrice: '500.00'
        }
      ]);
    } else if (transaction.invoiceNumber === 'INV-2024-004') {
      await db.insert(transactionItems).values([
        {
          transactionId: transaction.id,
          itemType: 'service',
          itemId: 5,
          itemName: 'Hair Cut & Style',
          quantity: 1,
          unitPrice: '1000.00',
          totalPrice: '1000.00',
          serviceStaffId: manager1.id
        },
        {
          transactionId: transaction.id,
          itemType: 'service',
          itemId: 3,
          itemName: 'Classic Manicure',
          quantity: 1,
          unitPrice: '800.00',
          totalPrice: '800.00',
          serviceStaffId: executive1.id
        }
      ]);
    } else if (transaction.invoiceNumber === 'INV-2024-005') {
      await db.insert(transactionItems).values({
        transactionId: transaction.id,
        itemType: 'service',
        itemId: 3,
        itemName: 'Classic Manicure',
        quantity: 1,
        unitPrice: '800.00',
        totalPrice: '800.00',
        serviceStaffId: executive2.id
      });
    }
  }

  // Setup WhatsApp settings
  await db.insert(whatsappSettings).values({
    storeId: store1.id,
    accessToken: 'test_access_token_12345',
    phoneNumberId: '1234567890',
    businessAccountId: 'business_account_123',
    webhookUrl: 'https://yourapp.com/webhook',
    isActive: true
  });

  // Create WhatsApp templates
  await db.insert(whatsappTemplates).values([
    {
      storeId: store1.id,
      name: 'Welcome Message',
      type: 'welcome',
      content: 'Welcome to {{store_name}}! Thank you for choosing our services. We look forward to serving you.',
      variables: 'store_name',
      isActive: true
    },
    {
      storeId: store1.id,
      name: 'Appointment Reminder',
      type: 'appointment',
      content: 'Hi {{customer_name}}, this is a reminder for your appointment at {{store_name}} on {{date}} at {{time}}.',
      variables: 'customer_name,store_name,date,time',
      isActive: true
    }
  ]);

  console.log('✅ Database seeded successfully with realistic data');
  console.log('📊 Created:');
  console.log('  - 5 users (1 super admin, 2 managers, 2 cashiers)');
  console.log('  - 2 stores (VEEPRESS, Elite Nail Studio)');
  console.log('  - 5 services across 3 categories');
  console.log('  - 3 products across 2 categories');
  console.log('  - 3 customers with varied profiles');
  console.log('  - 2 membership plans with active memberships');
  console.log('  - 5 realistic transactions with items');
  console.log('  - WhatsApp settings and templates');
}

async function main() {
  try {
    await flushDatabase();
    await seedDatabase();
    console.log('🎉 Database flush and seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database operation:', error);
    process.exit(1);
  }
}

main();