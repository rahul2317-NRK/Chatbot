import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/config.js';
import logger from './utils/logger.js';
import dbManager from './database/dynamodb.js';

// Import routes
import chatRoutes from './routes/chat.js';
import propertyRoutes from './routes/properties.js';
import mcpRoutes from './routes/mcp.js';
import authRoutes from './routes/auth.js';

// Import middleware
import { requestLogger } from './middleware/logging.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// Get current directory (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BluePixelServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: config.cors
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // CORS
    this.app.use(cors(config.cors));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Session management
    this.app.use(session(config.session));

    // Request logging
    this.app.use(requestLogger);

    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
    this.app.use('/assets', express.static(path.join(__dirname, '../assets')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await dbManager.healthCheck();
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'Blue Pixel AI Chatbot',
          version: '1.0.0',
          environment: config.environment,
          database: dbHealth
        });
      } catch (error) {
        logger.logError(error, { endpoint: '/health' });
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    // API Routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/chat', chatRoutes);
    this.app.use('/api/properties', propertyRoutes);
    this.app.use('/api/mcp', mcpRoutes);

    // Main chat interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.originalUrl
      });
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info('New WebSocket connection', { socketId: socket.id });

      // Join a session room
      socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        logger.debug('Socket joined session', { socketId: socket.id, sessionId });
      });

      // Handle chat messages
      socket.on('chat_message', async (data) => {
        try {
          const { message, sessionId, userId } = data;
          
          // Process the message through the chat service
          const chatService = await import('./services/chatService.js');
          const response = await chatService.default.processMessage({
            message,
            sessionId,
            userId
          });

          // Send response back to the client
          socket.to(sessionId).emit('ai_response', {
            response: response.response,
            sessionId: response.sessionId,
            timestamp: response.timestamp,
            toolsUsed: response.toolsUsed,
            propertyData: response.propertyData
          });

          // Also send to the sender
          socket.emit('ai_response', {
            response: response.response,
            sessionId: response.sessionId,
            timestamp: response.timestamp,
            toolsUsed: response.toolsUsed,
            propertyData: response.propertyData
          });

        } catch (error) {
          logger.logError(error, { socketId: socket.id, data });
          socket.emit('error', {
            message: 'Failed to process message',
            error: error.message
          });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (sessionId) => {
        socket.to(sessionId).emit('user_typing', { socketId: socket.id });
      });

      socket.on('typing_stop', (sessionId) => {
        socket.to(sessionId).emit('user_stopped_typing', { socketId: socket.id });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('WebSocket disconnected', { socketId: socket.id });
      });
    });
  }

  setupErrorHandling() {
    // Error handling middleware
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.gracefulShutdown();
    });
  }

  gracefulShutdown() {
    logger.info('Starting graceful shutdown...');
    
    this.server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connections if needed
      // Close other resources
      
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }

  start() {
    this.server.listen(config.port, config.host, () => {
      logger.info(`🚀 Blue Pixel AI Chatbot server started`, {
        host: config.host,
        port: config.port,
        environment: config.environment,
        nodeVersion: process.version
      });
      
      logger.info(`📍 Server URLs:`, {
        local: `http://localhost:${config.port}`,
        health: `http://localhost:${config.port}/health`,
        docs: `http://localhost:${config.port}/api/mcp/tools`
      });
    });
  }
}

// Start the server
const server = new BluePixelServer();
server.start();

export default server;