import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

// Import middleware
import requestLogger from './middleware/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import routes from './routes';

// Import services
import { initializeSocket } from './services/SocketService';

// Import Swagger configuration
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  process.exit(1);
}

// Warn about optional but recommended environment variables
const recommendedEnvVars = ['JWT_REFRESH_SECRET', 'FRONTEND_URL'];
const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);

if (missingRecommended.length > 0) {
  console.warn('⚠️  Missing recommended environment variables:');
  missingRecommended.forEach(varName => {
    console.warn(`  - ${varName}`);
  });
}

console.log('✅ Environment variables loaded successfully');

// Initialize Prisma client
export const prisma = new PrismaClient();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (needed for rate limiting behind load balancers)
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://gurbetlik-client.vercel.app", // Production domain
      "https://api.abroado.com.tr",
      "https://abroado.com.tr",
      "https://abroado.com",
      "https://www.abroado.com",
      "https://www.abroado.com.tr",
    ];
    
    // Allow requests with no origin (server-to-server, health checks, etc.)
    if (!origin) {
      console.log('[CORS] Request with no origin - allowing');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] Origin allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`[CORS] Origin blocked: ${origin}`);
      console.log('[CORS] Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token',
    'X-Auth-Token'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://gurbetlik-client.vercel.app", // Production domain
        "https://api.abroado.com.tr",
        "https://abroado.com.tr",
        "https://abroado.com",
        "https://www.abroado.com",
        "https://www.abroado.com.tr",
      ];
     
      
      // Allow requests with no origin (server-to-server, health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`Socket.IO CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
  }
});

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if causing issues with external resources
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Reduced from 10mb
app.use(requestLogger);
app.use(generalLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Gurbetci API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Gurbetci Server is running',
    timestamp: new Date().toISOString(),
    database: 'connected',
    websocket: 'active',
    documentation: '/api-docs'
  });
});

// Debug endpoint for production troubleshooting
app.get('/debug/env', (req, res) => {
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '✓ Set' : '✗ Missing',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ? `✓ Set: ${process.env.COOKIE_DOMAIN}` : '✗ Not set',
    FRONTEND_URL: process.env.FRONTEND_URL ? `✓ Set: ${process.env.FRONTEND_URL}` : '✗ Not set',
    DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
    timestamp: new Date().toISOString()
  };
  
  res.json(envDebug);
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize Socket.IO service
initializeSocket(io, prisma);

const PORT = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Disconnect from database
  await prisma.$disconnect();
  console.log('Database connection closed');
  
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📡 WebSocket server initialized`);
  console.log(`💾 Database connected`);
  console.log(`📚 API Documentation available at: http://localhost:${PORT}/api-docs`);
}); 
