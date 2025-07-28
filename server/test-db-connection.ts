import { db } from './db-sqlite';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.run(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');

    // Check table structure
    console.log('\n📋 Checking transactions table structure...');
    const pragma = await db.run(sql`PRAGMA table_info(transactions)`);
    console.log('Transactions table info:', pragma);

    // Try a simple insert
    console.log('\n🔨 Testing transaction insert...');
    const insertResult = await db.run(sql`
      INSERT INTO transactions (
        store_id, customer_id, invoice_number, subtotal, 
        tax_amount, total_amount, payment_method, created_at
      ) VALUES (
        1, 35, 'TEST-001', 1500.00, 
        270.00, 1770.00, 'cash', datetime('now')
      )
    `);
    
    console.log('✅ Transaction insert successful:', insertResult);
    console.log('Transaction ID:', insertResult.lastInsertRowid);

    // Clean up test data
    await db.run(sql`DELETE FROM transactions WHERE invoice_number = 'TEST-001'`);
    console.log('✅ Test cleanup completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection().catch(console.error);
}

export { testDatabaseConnection };