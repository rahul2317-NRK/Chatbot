#!/usr/bin/env python3
"""
Blue Pixel AI Chatbot - Run Script
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print("🚀 Starting Blue Pixel AI Chatbot...")
    print(f"📍 Environment: {settings.environment}")
    print(f"🌐 Host: {settings.host}:{settings.port}")
    print(f"🔧 Debug mode: {settings.debug}")
    print("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )