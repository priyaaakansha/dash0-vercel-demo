import { trace, SpanStatusCode } from "@opentelemetry/api"

// Get tracer instance
const tracer = trace.getTracer("bucket-list-app", "1.0.0")

// Utility to create and manage spans
export function createSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  return tracer.startSpan(name, {
    attributes: {
      "service.name": "bucket-list-app",
      ...attributes,
    },
  })
}

// Trace async operations
export async function traceAsync<T>(
  spanName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const span = createSpan(spanName, attributes)

  try {
    const result = await operation()
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    })
    throw error
  } finally {
    span.end()
  }
}

// Trace sync operations
export function traceSync<T>(
  spanName: string,
  operation: () => T,
  attributes?: Record<string, string | number | boolean>,
): T {
  const span = createSpan(spanName, attributes)

  try {
    const result = operation()
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    })
    throw error
  } finally {
    span.end()
  }
}

// Trace user actions
export function traceUserAction(action: string, attributes?: Record<string, string | number | boolean>) {
  const span = createSpan(`user.${action}`, {
    "user.action": action,
    ...attributes,
  })

  // Auto-end user action spans quickly
  setTimeout(() => {
    span.setStatus({ code: SpanStatusCode.OK })
    span.end()
  }, 100)
}

// Get current trace context
export function getCurrentTraceId(): string | undefined {
  const activeSpan = trace.getActiveSpan()
  return activeSpan?.spanContext().traceId
}
