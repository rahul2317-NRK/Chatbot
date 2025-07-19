import fs from 'fs';
import path from 'path';

// Simple logger utility
class Logger {
  constructor() {
    // Ensure logs directory exists
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}`;
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    console.log(formattedMessage);
    
    // File output (simple append)
    try {
      fs.appendFileSync('logs/app.log', formattedMessage + '\n');
      
      // Also write errors to error log
      if (level === 'error') {
        fs.appendFileSync('logs/error.log', formattedMessage + '\n');
      }
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

const logger = new Logger();
export default logger;