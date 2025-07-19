# 🚀 Blue Pixel AI Chatbot - Node.js Implementation

A modern real estate investment assistant powered by AI, built with Node.js, Express, Socket.IO, and advanced MCP (Model Context Protocol) tools for real-time property analysis and investment calculations.

## ✨ Features

### 🏠 **Real Estate Intelligence**
- **Property Search & Analysis** - AI-powered property discovery
- **Mortgage Calculations** - Basic and advanced mortgage calculations with PMI, taxes, and insurance
- **Investment Analysis** - ROI, cap rate, and cash flow calculations
- **Interest Rate Lookup** - Location-based current interest rates
- **Market Insights** - Property trends and market data

### 🔧 **Technical Features**
- **Real-time Chat** - WebSocket-based instant messaging with Socket.IO
- **MCP Tools Integration** - 10+ specialized real estate tools
- **AI Integration** - OpenAI GPT with context-aware responses
- **Modern UI** - Beautiful, responsive interface with Tailwind CSS and Alpine.js
- **Production Ready** - Comprehensive logging, error handling, and security

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Blue Pixel AI Chatbot                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (public/index.html)                                  │
│  • Modern HTML5 + Alpine.js + Tailwind CSS                     │
│  • Real-time WebSocket communication                           │
│  • Responsive design with live status monitoring               │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Node.js + Express)                                   │
│  • Express.js server with Socket.IO                           │
│  • RESTful API endpoints                                       │
│  • Real-time WebSocket handling                               │
│  • Security middleware (Helmet, CORS, Rate limiting)          │
├─────────────────────────────────────────────────────────────────┤
│  AI Service (src/services/aiService.js)                       │
│  • OpenAI GPT integration                                     │
│  • MCP Tools orchestration                                    │
│  • Context-aware response generation                          │
│  • Intent analysis and tool selection                         │
├─────────────────────────────────────────────────────────────────┤
│  MCP Tools (Built-in)                                         │
│  • Property search and analysis                               │
│  • Mortgage and financial calculations                        │
│  • Interest rate lookup                                       │
│  • Investment analysis (ROI, cap rate)                        │
│  • Market data and trends                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- OpenAI API key

### **1. Install Dependencies**
```bash
npm install
```

### **2. Setup Environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (defaults provided)
PORT=3000
NODE_ENV=development
```

### **3. Start the Application**

**Development Mode (recommended):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

### **4. Access the Application**
Open your browser to: **http://localhost:3000**

## 🔧 **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run setup` | Install dependencies and create directories |
| `npm run clean` | Clean install (remove node_modules and reinstall) |

## 📡 **API Endpoints**

### **Health & System**
- `GET /health` - Server health check
- `GET /api/mcp/tools` - Available MCP tools

### **Chat System**
- `POST /api/chat/sessions` - Create new chat session
- `WebSocket /socket.io` - Real-time chat communication

### **WebSocket Events**

**Client → Server:**
```javascript
socket.emit('join_session', sessionId);
socket.emit('chat_message', { message, sessionId, userId });
socket.emit('typing_start', sessionId);
socket.emit('typing_stop', sessionId);
```

**Server → Client:**
```javascript
socket.on('ai_response', (data) => {
  // { response, sessionId, timestamp, toolsUsed, propertyData, executionTime }
});
socket.on('error', (data) => {
  // { message, error }
});
```

## 🛠️ **MCP Tools Available**

1. **validatePromptRelevance** - Ensures real estate topic relevance
2. **searchPropertyInfo** - Property search and discovery
3. **getUserChatHistory** - Session-based conversation context
4. **getPropertyDetails** - Detailed property information
5. **getInterestRates** - Location-based interest rates
6. **calculateMortgage** - Basic mortgage calculations
7. **calculateMortgageAdvanced** - Advanced mortgage with PMI, taxes, insurance
8. **getUserSavedProperties** - User's saved property portfolio
9. **getServicedProperties** - Platform-available properties
10. **getFinancialCalculator** - ROI, cap rate, cash flow calculations

## 🎯 **Testing the System**

Try these sample conversations:

### **Property Search**
```
"Find properties under $500,000"
"Show me houses in downtown area"
"Search for 3-bedroom homes"
```

### **Mortgage Calculations**
```
"Calculate mortgage for $450,000 with $90,000 down payment"
"What's the monthly payment for a $300,000 loan at 7% interest?"
"Show me advanced mortgage calculation with PMI"
```

### **Investment Analysis**
```
"Calculate ROI for $100,000 investment with $8,000 annual return"
"What's the cap rate for property earning $50,000 annually worth $600,000?"
"Show me cash flow analysis"
```

### **Market Data**
```
"What are current interest rates?"
"Show me interest rates in California"
"Current FHA loan rates"
```

## 📁 **Project Structure**

```
blue-pixel-ai-chatbot/
├── package.json              # Dependencies and scripts
├── .env.example              # Environment template
├── README.md                 # This file
│
├── public/                   # Frontend files
│   └── index.html           # Modern chat interface
│
└── src/                     # Backend source
    ├── server.js            # Main Express server
    ├── services/
    │   └── aiService.js     # OpenAI + MCP integration
    └── utils/
        └── logger.js        # Logging utility
```

## 🔒 **Security Features**

- **Helmet.js** - Security headers and CSP
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **Input Validation** - Request sanitization
- **Session Security** - Secure session management
- **Error Handling** - Comprehensive error management

## 📊 **Monitoring & Logging**

### **Real-time Monitoring**
- WebSocket connection status
- Tool execution performance
- Session statistics
- Error tracking

### **Log Files**
- `logs/app.log` - Application logs
- `logs/error.log` - Error logs
- Console output in development

## 🌐 **Environment Variables**

### **Required**
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### **Optional**
```env
PORT=3000
NODE_ENV=development
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

## 🚀 **Deployment Options**

### **Local Development**
```bash
npm run dev
```

### **Production Server**
```bash
npm start
```

### **Docker (Optional)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### **Cloud Platforms**
- **Heroku** - Easy deployment with git
- **Vercel** - Serverless deployment
- **AWS** - EC2, Lambda, or ECS
- **DigitalOcean** - App Platform

## 🔧 **Customization**

### **Adding New MCP Tools**
Edit `src/services/aiService.js` and add your tool:

```javascript
async myNewTool(message) {
  // Your tool logic here
  return { result: "Tool output" };
}
```

### **Modifying the UI**
Edit `public/index.html` to customize the interface.

### **Adding New Endpoints**
Add routes in `src/server.js`:

```javascript
app.get('/api/my-endpoint', (req, res) => {
  res.json({ message: 'Hello World' });
});
```

## 🐛 **Troubleshooting**

### **Common Issues**

**Port 3000 in use:**
```bash
# Change port in .env
PORT=3001
```

**OpenAI API errors:**
- Verify API key in `.env`
- Check OpenAI account credits
- Ensure proper API permissions

**WebSocket connection issues:**
- Check firewall settings
- Verify CORS configuration
- Try refreshing the browser

### **Debug Mode**
```bash
NODE_ENV=development npm run dev
```

## 📚 **Documentation**

- **API Reference** - Visit `/api/mcp/tools` when running
- **WebSocket Events** - See source code in `src/server.js`
- **MCP Tools** - Check `src/services/aiService.js`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 **License**

MIT License - see LICENSE file for details

## 🆘 **Support**

- **Issues** - Create GitHub issue
- **Documentation** - Check README and code comments
- **Logs** - Check `logs/` directory for debugging

---

**🎉 Ready to chat with your AI real estate assistant!**

Start the server and visit `http://localhost:3000` to begin your real estate investment journey with Blue Pixel AI.