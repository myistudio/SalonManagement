import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    const hashedPassword = await hashPassword("admin123");
    
    await storage.createUser({
      id: "admin_001",
      email: "admin@salon.com",
      mobile: null,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      role: "super_admin",
      isActive: true,
    });

    console.log("✓ Admin user created successfully");
    console.log("Email: admin@salon.com");
    console.log("Password: admin123");
  } catch (error) {
    console.log("Admin user already exists or error:", error);
  }
}

createAdminUser();