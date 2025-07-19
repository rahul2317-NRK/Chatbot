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
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import services
import { AIService } from './services/aiService.js';
import logger from './utils/logger.js';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const aiService = new AIService();

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'bluepixel-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Blue Pixel AI Chatbot (Node.js)',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// MCP Tools endpoint
app.get('/api/mcp/tools', (req, res) => {
  res.json({
    availableTools: [
      'validatePromptRelevance',
      'searchPropertyInfo', 
      'getUserChatHistory',
      'getPropertyDetails',
      'getInterestRates',
      'calculateMortgage',
      'getUserSavedProperties',
      'getServicedProperties',
      'calculateMortgageAdvanced',
      'getFinancialCalculator'
    ],
    totalCount: 10,
    timestamp: new Date().toISOString()
  });
});

// Create chat session endpoint
app.post('/api/chat/sessions', (req, res) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('New chat session created', { sessionId, userId });
  
  res.json({
    sessionId,
    userId,
    createdAt: new Date().toISOString(),
    message: 'Session created successfully'
  });
});

// Main chat interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('New WebSocket connection', { socketId: socket.id });

  // Join a session room
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    logger.info('Socket joined session', { socketId: socket.id, sessionId });
  });

  // Handle chat messages
  socket.on('chat_message', async (data) => {
    try {
      const { message, sessionId, userId } = data;
      logger.info('Processing chat message', { sessionId, userId, messageLength: message.length });
      
      // Process the message through the AI service
      const response = await aiService.processMessage({
        message,
        sessionId,
        userId
      });

      // Send response back to the client
      const responseData = {
        response: response.response,
        sessionId: response.sessionId,
        timestamp: response.timestamp,
        toolsUsed: response.toolsUsed || [],
        propertyData: response.propertyData,
        executionTime: response.executionTime
      };

      // Send to all clients in the session
      io.to(sessionId).emit('ai_response', responseData);
      
      logger.info('AI response sent', { sessionId, toolsUsed: response.toolsUsed?.length || 0 });

    } catch (error) {
      logger.error('Error processing message:', error);
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Application error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Blue Pixel AI Chatbot server started on port ${PORT}`);
  logger.info(`📍 Access the application at: http://localhost:${PORT}`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔧 MCP Tools: http://localhost:${PORT}/api/mcp/tools`);
});

export default server;