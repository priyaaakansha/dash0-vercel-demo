// Logger utility with structured logging
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  itemId?: string
  category?: string
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.logLevel = process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        sessionId: this.sessionId,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      },
      error,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const contextStr = entry.context ? JSON.stringify(entry.context) : ""
    const errorStr = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : ""

    return `[${entry.timestamp}] ${levelName}: ${entry.message} ${contextStr}${errorStr}`
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedLog = this.formatLogEntry(entry)

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.ERROR:
        console.error(formattedLog)
        break
    }

    // In production, you might want to send logs to a service like Dash0
    if (process.env.NODE_ENV === "production") {
      this.sendToLogService(entry)
    }
  }

  private async sendToLogService(entry: LogEntry): Promise<void> {
    try {
      // Example: Send to Dash0 or other logging service
      // This would be configured with your actual logging endpoint
      if (typeof window !== "undefined" && window.fetch) {
        await fetch("/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entry),
        })
      }
    } catch (error) {
      // Fallback to console if logging service fails
      console.error("Failed to send log to service:", error)
    }
  }

  debug(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.DEBUG, message, context))
  }

  info(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.INFO, message, context))
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.WARN, message, context))
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.output(this.createLogEntry(LogLevel.ERROR, message, context, error))
  }

  // Performance logging
  time(label: string, context?: LogContext): void {
    const startTime = performance.now()
    this.debug(`Timer started: ${label}`, { ...context, startTime })
  }

  timeEnd(label: string, context?: LogContext): void {
    const endTime = performance.now()
    this.debug(`Timer ended: ${label}`, { ...context, endTime })
  }

  // User action logging
  logUserAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      component: "BucketListApp",
      action,
    })
  }

  // Data operation logging
  logDataOperation(operation: string, context?: LogContext): void {
    this.info(`Data operation: ${operation}`, {
      ...context,
      component: "DataLayer",
      operation,
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Performance monitoring decorator
export function logPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = function (...args: any[]) {
    const startTime = performance.now()
    const result = method.apply(this, args)
    const endTime = performance.now()

    logger.debug(`Method ${propertyName} executed`, {
      component: target.constructor.name,
      method: propertyName,
      executionTime: `${(endTime - startTime).toFixed(2)}ms`,
    })

    return result
  }

  return descriptor
}
