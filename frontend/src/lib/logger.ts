// PERFORMANCE FIX: 2025-09-30 - Environment-aware logging that doesn't yeet logs into production 🤫
// Replaces 64+ console.log statements with proper logging levels

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;
  private isClient: boolean;

  constructor() {
    // check if we're in dev mode and on client side
    this.isClient = typeof window !== 'undefined';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings (they're important fr)
    if (level === 'error' || level === 'warn') {
      return true;
    }
    // Only log debug/info in development
    return this.isDevelopment;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  /**
   * Debug logging - only shows in development
   * Use this for detailed debugging info that nobody needs in prod
   */
  debug(message: string, context?: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context), ...args);
    }
  }

  /**
   * Info logging - only shows in development
   * Use this for general information flow tracking
   */
  info(message: string, context?: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context), ...args);
    }
  }

  /**
   * Warning logging - shows in all environments
   * Use this when something is sus but not broken
   */
  warn(message: string, context?: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context), ...args);
    }
  }

  /**
   * Error logging - shows in all environments
   * Use this when things are actually broken
   */
  error(message: string, context?: string, error?: unknown, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context), error, ...args);
    }
  }

  /**
   * Group logging for related log statements (dev only)
   * Helps organize console output when debugging
   */
  group(label: string, callback: () => void) {
    if (this.isDevelopment && this.isClient) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Table logging for objects/arrays (dev only)
   * Because sometimes you just need that table view fr fr
   */
  table(data: unknown, label?: string) {
    if (this.isDevelopment && this.isClient) {
      if (label) console.log(label);
      console.table(data);
    }
  }
}

// Export singleton instance - one logger to rule them all 💍
export const logger = new Logger();

// Convenience exports for cleaner imports
export const { debug, info, warn, error, group, table } = logger;



