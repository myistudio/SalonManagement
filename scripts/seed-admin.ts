import bcrypt from 'bcrypt';
import { db } from '../server/db';
import { users, stores, storeStaff } from '../shared/schema';

async function seedAdmin() {
  try {
    console.log('Seeding admin user and default store...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [adminUser] = await db.insert(users).values({
      id: 'admin_001',
      email: 'admin@salon.com',
      mobile: '+1234567890',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true
    }).returning();

    console.log('Admin user created:', adminUser.email);

    // Create default store
    const [defaultStore] = await db.insert(stores).values({
      name: 'Main Salon',
      address: '123 Beauty Street',
      city: 'Beauty City',
      state: 'BC',
      zipCode: '12345',
      phone: '+1234567890',
      email: 'info@mainsalon.com',
      description: 'Our main salon location',
      isActive: true,
      themeColor: '#8B5CF6',
      openingTime: '09:00',
      closingTime: '18:00',
      slotDuration: 30
    }).returning();

    console.log('Default store created:', defaultStore.name);

    // Assign admin to store
    await db.insert(storeStaff).values({
      storeId: defaultStore.id,
      userId: adminUser.id,
      role: 'super_admin',
      isActive: true
    });

    console.log('Admin assigned to store');

    console.log('\n=== ADMIN CREDENTIALS ===');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('Role: Super Admin');
    console.log('==========================\n');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAdmin();