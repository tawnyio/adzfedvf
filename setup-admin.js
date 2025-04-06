import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function setupAdmin() {
  try {
    // Configuration de l'admin
    const adminEmail = 'tawny@admin.net';
    const adminPassword = '12Zmansour';
    
    console.log('Vérification si l\'utilisateur existe déjà...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.select().from(users).where(eq(users.username, adminEmail)).limit(1);
    
    if (existingUser && existingUser.length > 0) {
      console.log('L\'utilisateur admin existe déjà.');
      process.exit(0);
    }
    
    // Hacher le mot de passe
    const hashedPassword = await hashPassword(adminPassword);
    
    // Créer l'utilisateur admin
    const [admin] = await db.insert(users).values({
      username: adminEmail,
      password: hashedPassword,
      isAdmin: true
    }).returning();
    
    console.log('Utilisateur administrateur créé avec succès:', {
      id: admin.id,
      username: admin.username,
      isAdmin: admin.isAdmin
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
    process.exit(1);
  }
}

setupAdmin();