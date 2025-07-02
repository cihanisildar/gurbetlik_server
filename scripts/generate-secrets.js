#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate cryptographically secure secrets for the application
 */
class SecretGenerator {
  
  static generateBase64Secret(length = 64) {
    return crypto.randomBytes(length).toString('base64');
  }

  static generateHexSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateAlphanumericSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateUUIDSecret() {
    return crypto.randomUUID();
  }

  static generateSecrets() {
    return {
      JWT_SECRET: this.generateBase64Secret(64),
      JWT_REFRESH_SECRET: this.generateBase64Secret(64),
      SESSION_SECRET: this.generateBase64Secret(32),
      COOKIE_SECRET: this.generateHexSecret(32),
      ENCRYPTION_KEY: this.generateHexSecret(32),
      API_SECRET: this.generateAlphanumericSecret(48)
    };
  }

  static createEnvFile() {
    const secrets = this.generateSecrets();
    const envPath = path.join(process.cwd(), '.env.secrets');
    
    const envContent = `# Generated Secrets - $(new Date().toISOString())
# Copy these to your .env file and customize other values as needed

# JWT Configuration (Generated)
JWT_SECRET="${secrets.JWT_SECRET}"
JWT_REFRESH_SECRET="${secrets.JWT_REFRESH_SECRET}"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Session & Cookie Security (Generated)
SESSION_SECRET="${secrets.SESSION_SECRET}"
COOKIE_SECRET="${secrets.COOKIE_SECRET}"

# Additional Security (Generated)
ENCRYPTION_KEY="${secrets.ENCRYPTION_KEY}"
API_SECRET="${secrets.API_SECRET}"

# Security Configuration
BCRYPT_ROUNDS=12
NODE_ENV=development

# Database (Update with your values)
DATABASE_URL="postgresql://username:password@localhost:5432/gurbetci_db?schema=public"

# Server
PORT=3000

# Google OAuth (Update with your values)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret" 
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Frontend URL (Update with your domain)
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=100
`;

    fs.writeFileSync(envPath, envContent);
    return envPath;
  }

  static validateSecret(secret, minLength = 32) {
    if (!secret || secret.length < minLength) {
      return {
        valid: false,
        reason: `Secret must be at least ${minLength} characters`
      };
    }

    // Check for common weak secrets
    const weakSecrets = [
      'secret', 'password', '123456', 'admin', 'test',
      'your-secret-here', 'jwt-secret', 'change-me'
    ];

    if (weakSecrets.some(weak => secret.toLowerCase().includes(weak))) {
      return {
        valid: false,
        reason: 'Secret contains common weak patterns'
      };
    }

    return { valid: true };
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔐 Gurbetci Secret Generator\n');

  switch (command) {
    case 'generate':
    case 'gen':
      const secrets = SecretGenerator.generateSecrets();
      console.log('Generated Secrets:');
      console.log('==================');
      Object.entries(secrets).forEach(([key, value]) => {
        console.log(`${key}="${value}"`);
      });
      console.log('\n💡 Copy these to your .env file');
      break;

    case 'create-env':
    case 'env':
      const envPath = SecretGenerator.createEnvFile();
      console.log(`✅ Created secret environment file: ${envPath}`);
      console.log('📝 Copy the contents to your .env file and update other values');
      break;

    case 'jwt':
      const jwtSecret = SecretGenerator.generateBase64Secret(64);
      console.log('JWT Secret:');
      console.log(`JWT_SECRET="${jwtSecret}"`);
      break;

    case 'validate':
      const secretToValidate = args[1];
      if (!secretToValidate) {
        console.error('❌ Please provide a secret to validate');
        console.log('Usage: node generate-secrets.js validate "your-secret-here"');
        process.exit(1);
      }
      
      const validation = SecretGenerator.validateSecret(secretToValidate);
      if (validation.valid) {
        console.log('✅ Secret is valid');
      } else {
        console.log(`❌ Secret is invalid: ${validation.reason}`);
      }
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log('Usage: node generate-secrets.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  generate, gen     Generate all secrets');
      console.log('  create-env, env   Create .env.secrets file');
      console.log('  jwt              Generate only JWT secret');
      console.log('  validate [secret] Validate a secret');
      console.log('  help             Show this help');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-secrets.js generate');
      console.log('  node generate-secrets.js create-env');
      console.log('  node generate-secrets.js validate "my-secret"');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { SecretGenerator }; 