import { promises as fs } from 'fs';
import path from 'path';
import { getISTDateTime } from '../utils/timezone';

const BACKUP_DIR = './backups';
const DATABASE_FILE = './salon.db';

// Ensure backup directory exists
export async function ensureBackupDirectory(): Promise<void> {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Create database backup (disabled for PostgreSQL)
export async function createBackup(): Promise<string> {
  // No longer needed with PostgreSQL - database is persistent
  console.log('Database backup skipped - using PostgreSQL');
  return 'backup-skipped';
}

// Auto backup every hour
export function startAutoBackup(): void {
  // Create initial backup
  createBackup().catch(console.error);
  
  // Then backup every hour
  setInterval(() => {
    createBackup().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
}

// Cleanup old backups (keep only last 24 backups)
export async function cleanupOldBackups(): Promise<void> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('salon-backup-') && file.endsWith('.db'))
      .sort()
      .reverse(); // Most recent first
    
    // Keep only the most recent 24 backups
    const filesToDelete = backupFiles.slice(24);
    
    for (const file of filesToDelete) {
      await fs.unlink(path.join(BACKUP_DIR, file));
      console.log(`Deleted old backup: ${file}`);
    }
  } catch (error) {
    console.error('Error cleaning up backups:', error);
  }
}

// Restore from backup
export async function restoreFromBackup(backupFile: string): Promise<void> {
  try {
    await fs.copyFile(backupFile, DATABASE_FILE);
    console.log(`Database restored from: ${backupFile}`);
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}