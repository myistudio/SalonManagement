import { db } from "./db";
import { 
  stores, 
  services, 
  products, 
  customers, 
  membershipPlans, 
  customerMemberships,
  loyaltySettings 
} from "@shared/schema";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create sample stores
    console.log("Creating stores...");
    const [store1, store2] = await db.insert(stores).values([
      {
        name: "Glamour Salon & Spa",
        address: "123 Beauty Street, Mumbai, Maharashtra 400001",
        phone: "+91 9876543210",
        email: "info@glamoursalon.com",
      },
      {
        name: "Elite Nail Studio",
        address: "456 Fashion Avenue, Delhi, NCR 110001", 
        phone: "+91 9876543211",
        email: "contact@elitenails.com",
      }
    ]).returning();

    // Create membership plans
    console.log("Creating membership plans...");
    const [goldPlan, silverPlan, vipPlan] = await db.insert(membershipPlans).values([
      {
        storeId: store1.id,
        name: "Gold",
        description: "Premium membership with 15% discount",
        discountPercentage: "15.00",
        pointsMultiplier: "2.00",
        validityDays: 365,
        price: "2999.00",
      },
      {
        storeId: store1.id,
        name: "Silver", 
        description: "Standard membership with 10% discount",
        discountPercentage: "10.00",
        pointsMultiplier: "1.50",
        validityDays: 180,
        price: "1999.00",
      },
      {
        storeId: store1.id,
        name: "VIP",
        description: "Exclusive membership with 25% discount",
        discountPercentage: "25.00",
        pointsMultiplier: "3.00",
        validityDays: 730,
        price: "5999.00",
      }
    ]).returning();

    // Create loyalty settings
    console.log("Creating loyalty settings...");
    await db.insert(loyaltySettings).values([
      {
        storeId: store1.id,
        pointsPerRupee: "0.01",
        pointsRedemptionRate: "1.00",
        minimumRedemption: 100,
      },
      {
        storeId: store2.id,
        pointsPerRupee: "0.01", 
        pointsRedemptionRate: "1.00",
        minimumRedemption: 50,
      }
    ]);

    // Create services
    console.log("Creating services...");
    await db.insert(services).values([
      // Hair Services
      {
        storeId: store1.id,
        name: "Hair Cut & Styling",
        description: "Professional haircut with styling and blow-dry",
        price: "899.00",
        duration: 60,
        category: "Hair",
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Hair Color & Highlights",
        description: "Premium hair coloring with highlights",
        price: "2499.00",
        duration: 120,
        category: "Hair",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Hair Spa Treatment",
        description: "Nourishing hair spa with deep conditioning",
        price: "1599.00",
        duration: 90,
        category: "Hair",
        imageUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&h=300&fit=crop",
      },
      // Facial Services
      {
        storeId: store1.id,
        name: "Classic Facial",
        description: "Deep cleansing facial with moisturizing",
        price: "1299.00",
        duration: 75,
        category: "Facial",
        imageUrl: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Gold Facial",
        description: "Luxury gold facial for radiant skin",
        price: "2999.00",
        duration: 90,
        category: "Facial",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Anti-Aging Facial",
        description: "Advanced anti-aging treatment",
        price: "3499.00",
        duration: 100,
        category: "Facial",
        imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=300&h=300&fit=crop",
      },
      // Nail Services
      {
        storeId: store1.id,
        name: "Manicure",
        description: "Classic manicure with nail polish",
        price: "799.00",
        duration: 45,
        category: "Nails",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Pedicure",
        description: "Relaxing pedicure with foot massage",
        price: "899.00",
        duration: 60,
        category: "Nails",
        imageUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Gel Manicure",
        description: "Long-lasting gel nail polish application",
        price: "1199.00",
        duration: 60,
        category: "Nails",
        imageUrl: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&h=300&fit=crop",
      },
      // Body Services
      {
        storeId: store1.id,
        name: "Full Body Massage",
        description: "Relaxing full body massage therapy",
        price: "2199.00",
        duration: 90,
        category: "Body",
        imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Body Polishing",
        description: "Exfoliating body polish treatment",
        price: "1899.00",
        duration: 75,
        category: "Body",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
      }
    ]);

    // Create products
    console.log("Creating products...");
    await db.insert(products).values([
      // Hair Care Products
      {
        storeId: store1.id,
        name: "L'Oréal Professional Shampoo",
        description: "Professional grade moisturizing shampoo",
        price: "1299.00",
        cost: "800.00",
        barcode: "8901030875526",
        category: "Hair Care",
        brand: "L'Oréal",
        stock: 25,
        minStock: 5,
        imageUrl: "https://images.unsplash.com/photo-1556228578-dd1e858c2d6c?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Schwarzkopf Hair Mask",
        description: "Deep conditioning hair mask",
        price: "899.00",
        cost: "550.00",
        barcode: "4045787723001",
        category: "Hair Care",
        brand: "Schwarzkopf",
        stock: 18,
        minStock: 3,
        imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Matrix Hair Serum",
        description: "Smoothing hair serum for frizz control",
        price: "649.00",
        cost: "400.00",
        barcode: "8901030842737",
        category: "Hair Care",
        brand: "Matrix",
        stock: 32,
        minStock: 5,
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop",
      },
      // Skin Care Products
      {
        storeId: store1.id,
        name: "Himalaya Face Wash",
        description: "Gentle daily face cleanser",
        price: "199.00",
        cost: "120.00",
        barcode: "8901138500447",
        category: "Skin Care",
        brand: "Himalaya",
        stock: 45,
        minStock: 10,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Lotus Moisturizer",
        description: "Hydrating daily moisturizer",
        price: "349.00",
        cost: "210.00",
        barcode: "8904207500156",
        category: "Skin Care",
        brand: "Lotus",
        stock: 28,
        minStock: 5,
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "VLCC Sunscreen SPF 30",
        description: "Broad spectrum sun protection",
        price: "299.00",
        cost: "180.00",
        barcode: "8901248141016",
        category: "Skin Care",
        brand: "VLCC",
        stock: 22,
        minStock: 5,
        imageUrl: "https://images.unsplash.com/photo-1556229162-6fde79de6428?w=300&h=300&fit=crop",
      },
      // Nail Products
      {
        storeId: store1.id,
        name: "OPI Nail Polish - Red",
        description: "Premium nail polish in classic red",
        price: "799.00",
        cost: "480.00",
        barcode: "0094100000251",
        category: "Nail Care",
        brand: "OPI",
        stock: 15,
        minStock: 3,
        imageUrl: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Essie Base Coat",
        description: "Strengthening base coat for nails",
        price: "549.00",
        cost: "330.00",
        barcode: "0309975518009",
        category: "Nail Care",
        brand: "Essie",
        stock: 20,
        minStock: 4,
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=300&fit=crop",
      },
      {
        storeId: store1.id,
        name: "Sally Hansen Top Coat",
        description: "Fast-drying glossy top coat",
        price: "449.00",
        cost: "270.00",
        barcode: "0074170450309",
        category: "Nail Care",
        brand: "Sally Hansen",
        stock: 18,
        minStock: 3,
        imageUrl: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&h=300&fit=crop",
      },
      // Professional Tools
      {
        storeId: store1.id,
        name: "Professional Hair Dryer",
        description: "Ionic hair dryer with diffuser",
        price: "3999.00",
        cost: "2400.00",
        barcode: "8904444100012",
        category: "Tools",
        brand: "Philips",
        stock: 5,
        minStock: 1,
        imageUrl: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=300&fit=crop",
      }
    ]);

    // Create sample customers
    console.log("Creating customers...");
    const [customer1, customer2, customer3, customer4] = await db.insert(customers).values([
      {
        storeId: store1.id,
        firstName: "Priya",
        lastName: "Sharma",
        mobile: "9876543210",
        email: "priya.sharma@email.com",
        dateOfBirth: new Date("1990-05-15"),
        loyaltyPoints: 1250,
        totalVisits: 8,
        totalSpent: "12500.00",
      },
      {
        storeId: store1.id,
        firstName: "Anita",
        lastName: "Patel",
        mobile: "9876543211",
        email: "anita.patel@email.com",
        dateOfBirth: new Date("1985-08-22"),
        loyaltyPoints: 890,
        totalVisits: 5,
        totalSpent: "8900.00",
      },
      {
        storeId: store1.id,
        firstName: "Kavita",
        lastName: "Singh",
        mobile: "9876543212",
        email: "kavita.singh@email.com",
        dateOfBirth: new Date("1992-12-10"),
        loyaltyPoints: 2150,
        totalVisits: 12,
        totalSpent: "21500.00",
      },
      {
        storeId: store1.id,
        firstName: "Meera",
        lastName: "Joshi",
        mobile: "9876543213",
        email: "meera.joshi@email.com",
        dateOfBirth: new Date("1988-03-18"),
        loyaltyPoints: 450,
        totalVisits: 3,
        totalSpent: "4500.00",
      }
    ]).returning();

    // Create customer memberships
    console.log("Creating customer memberships...");
    await db.insert(customerMemberships).values([
      {
        customerId: customer1.id,
        membershipPlanId: goldPlan.id,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        isActive: true,
      },
      {
        customerId: customer3.id,
        membershipPlanId: vipPlan.id,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2025-12-31"),
        isActive: true,
      }
    ]);

    console.log("✅ Database seeding completed successfully!");
    console.log(`
📊 Seeded Data Summary:
• 2 Stores: Glamour Salon & Spa, Elite Nail Studio
• 3 Membership Plans: Gold (15%), Silver (10%), VIP (25%)
• 11 Services: Hair, Facial, Nail, and Body treatments
• 10 Products: Hair care, Skin care, Nail products, Tools
• 4 Customers: With loyalty points and visit history
• 2 Active Memberships: Gold and VIP members

🎯 Test Features:
• Manual price entry for services in billing
• Product/service images in billing screen
• Barcode printing for products
• Customer loyalty points and memberships
• Multi-store management
    `);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedDatabase };