import { type NextRequest, NextResponse } from "next/server"
import { createSpan } from "@/lib/tracing"

export async function POST(request: NextRequest) {
  const span = createSpan("api.logs.post", {
    "http.method": "POST",
    "http.route": "/api/logs",
  })

  try {
    const logEntry = await request.json()

    span.setAttributes({
      "log.level": logEntry.level,
      "log.component": logEntry.context?.component || "unknown",
    })

    console.log("Received log entry:", JSON.stringify(logEntry, null, 2))

    span.setStatus({ code: 1 }) // OK
    return NextResponse.json({ success: true })
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({ code: 2, message: (error as Error).message }) // ERROR

    console.error("Error processing log entry:", error)
    return NextResponse.json({ error: "Failed to process log entry" }, { status: 500 })
  } finally {
    span.end()
  }
}
