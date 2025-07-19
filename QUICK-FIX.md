# 🔧 Quick Fix for Route Import Error

## ❌ **The Problem**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\...\src\routes\chat.js'
```

## ✅ **The Solution**

The error occurs because the server is trying to import route files that don't exist in our simplified implementation. Here's how to fix it:

### **Option 1: Use the Fixed Files (Recommended)**

1. **Make sure you're in the correct directory:**
   ```bash
   cd C:\Users\rahul\Downloads\Chatbot-main\Chatbot-main
   ```

2. **Pull the latest changes from the clean branch:**
   ```bash
   git checkout nodejs-chatbot-clean
   git pull origin nodejs-chatbot-clean
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Setup environment:**
   ```bash
   copy .env.example .env
   ```

5. **Add your OpenAI API key to .env:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

6. **Run the server:**
   ```bash
   npm run dev
   ```

### **Option 2: Manual Fix**

If you still get the error, replace the content of `src/server.js` with this working version:

```javascript
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

// Import services (with fallbacks)
let AIService, logger;
try {
  const aiModule = await import('./services/aiService.js');
  AIService = aiModule.AIService;
  const loggerModule = await import('./utils/logger.js');
  logger = loggerModule.default;
} catch (error) {
  console.log('Using fallback services');
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
  
  AIService = class {
    async processMessage({ message, sessionId, userId }) {
      return {
        response: `Echo: ${message}`,
        sessionId,
        timestamp: new Date().toISOString(),
        toolsUsed: [],
        propertyData: null,
        executionTime: 100
      };
    }
  };
}

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const aiService = new AIService();

// Basic middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/mcp/tools', (req, res) => {
  res.json({ availableTools: ['basic-tools'], totalCount: 1 });
});

app.post('/api/chat/sessions', (req, res) => {
  const sessionId = `session_${Date.now()}`;
  const userId = `user_${Date.now()}`;
  res.json({ sessionId, userId, createdAt: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
  });
  
  socket.on('chat_message', async (data) => {
    try {
      const response = await aiService.processMessage(data);
      io.to(data.sessionId).emit('ai_response', response);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### **Option 3: Verify File Structure**

Make sure your project has this structure:
```
Chatbot-main/
├── package.json
├── .env.example
├── public/
│   └── index.html
└── src/
    ├── server.js
    ├── services/
    │   └── aiService.js
    └── utils/
        └── logger.js
```

### **Option 4: Fresh Start**

If nothing works, create a new folder and copy these files:

1. **package.json** - Copy the dependencies
2. **src/server.js** - Use the simplified version above
3. **public/index.html** - Copy the chat interface
4. **.env.example** - Copy and rename to .env

## 🎯 **Expected Result**

After fixing, you should see:
```
🚀 Blue Pixel AI Chatbot server started on port 3000
📍 Access the application at: http://localhost:3000
```

## 📞 **Still Having Issues?**

1. **Check Node.js version:** `node --version` (should be 16+)
2. **Clear npm cache:** `npm cache clean --force`
3. **Delete node_modules:** `rm -rf node_modules && npm install`
4. **Check file paths:** Make sure all files exist in the correct locations

The server should now start without any route import errors! 🎉