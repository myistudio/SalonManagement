import { db } from './db-sqlite';
import { sql } from 'drizzle-orm';

async function checkData() {
  try {
    console.log('=== STORES ===');
    const stores = await db.all(sql`SELECT id, name FROM stores LIMIT 5`);
    console.log(stores);

    console.log('\n=== CUSTOMERS ==='); 
    const customers = await db.all(sql`SELECT id, first_name, last_name FROM customers LIMIT 5`);
    console.log(customers);

    console.log('\n=== SERVICES ===');
    const services = await db.all(sql`SELECT id, name FROM services LIMIT 5`);
    console.log(services);

    console.log('\n=== USER (STAFF) ===');
    const users = await db.all(sql`SELECT id, email, first_name, role FROM users LIMIT 5`);
    console.log(users);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();