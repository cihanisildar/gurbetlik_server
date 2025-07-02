import crypto from 'crypto';

interface SecretsConfig {
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET?: string;
  JWT_REFRESH_EXPIRES_IN?: string;
  BCRYPT_ROUNDS: number;
  SESSION_SECRET?: string;
}

class SecretsManager {
  private static instance: SecretsManager;
  private secrets: SecretsConfig;

  private constructor() {
    this.secrets = this.loadSecrets();
    this.validateSecrets();
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private loadSecrets(): SecretsConfig {
    const config: SecretsConfig = {
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12')
    };

    // Only add optional properties if they exist
    if (process.env.JWT_REFRESH_SECRET) {
      config.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    }
    if (process.env.SESSION_SECRET) {
      config.SESSION_SECRET = process.env.SESSION_SECRET;
    }

    return config;
  }

  private validateSecrets(): void {
    // Validate JWT Secret
    if (!this.secrets.JWT_SECRET) {
      throw new Error('JWT_SECRET is required. Generate one using: openssl rand -base64 64');
    }

    if (this.secrets.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for security');
    }

    // Check if using default/weak secrets
    const weakSecrets = [
      'your-super-secret-jwt-key-here',
      'secret',
      'jwt-secret',
      'mysecret',
      '123456'
    ];

    if (weakSecrets.some(weak => this.secrets.JWT_SECRET.includes(weak))) {
      console.warn('⚠️  WARNING: You are using a weak JWT secret! Generate a strong one with: openssl rand -base64 64');
    }

    // Validate bcrypt rounds
    if (this.secrets.BCRYPT_ROUNDS < 10 || this.secrets.BCRYPT_ROUNDS > 15) {
      console.warn('⚠️  WARNING: BCRYPT_ROUNDS should be between 10-15 for optimal security/performance balance');
    }

    // Validate refresh token secret if provided
    if (this.secrets.JWT_REFRESH_SECRET) {
      if (this.secrets.JWT_REFRESH_SECRET === this.secrets.JWT_SECRET) {
        throw new Error('JWT_REFRESH_SECRET must be different from JWT_SECRET');
      }
      if (this.secrets.JWT_REFRESH_SECRET.length < 32) {
        throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
      }
    }
  }

  // Getters
  public get jwtSecret(): string {
    return this.secrets.JWT_SECRET;
  }

  public get jwtExpiresIn(): string {
    return this.secrets.JWT_EXPIRES_IN;
  }

  public get jwtRefreshSecret(): string | undefined {
    return this.secrets.JWT_REFRESH_SECRET;
  }

  public get jwtRefreshExpiresIn(): string {
    return this.secrets.JWT_REFRESH_EXPIRES_IN!;
  }

  public get bcryptRounds(): number {
    return this.secrets.BCRYPT_ROUNDS;
  }

  public get sessionSecret(): string | undefined {
    return this.secrets.SESSION_SECRET;
  }

  // Utility methods
  public generateSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('base64');
  }

  public generateSecureSecret(): string {
    // Generate a cryptographically secure secret
    const buffer = crypto.randomBytes(64);
    return buffer.toString('base64');
  }

  // Security utilities
  public hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  public isSecretStrong(secret: string): boolean {
    return secret.length >= 32 && 
           !/^[a-zA-Z0-9]*$/.test(secret) && // Contains special characters
           /[A-Z]/.test(secret) && // Contains uppercase
           /[a-z]/.test(secret) && // Contains lowercase
           /[0-9]/.test(secret);   // Contains numbers
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Export individual secrets for backward compatibility
export const {
  jwtSecret,
  jwtExpiresIn,
  jwtRefreshSecret,
  jwtRefreshExpiresIn,
  bcryptRounds,
  sessionSecret
} = secretsManager;

// Export secret generation utilities
export const { generateSecret, generateSecureSecret } = secretsManager; 