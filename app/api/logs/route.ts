import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const logEntry = await request.json()

    // In a real application, you would send this to your logging service
    // For example, to Dash0 or another observability platform
    console.log("Received log entry:", JSON.stringify(logEntry, null, 2))

    // Example: Send to Dash0 (you would configure this with your actual endpoint)
    if (process.env.DASH0_LOG_DRAIN_ENDPOINT) {
      try {
        const response = await fetch(process.env.DASH0_LOG_DRAIN_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DASH0_AUTH_TOKEN}`,
            ...JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS || "{}"),
          },
          body: JSON.stringify({
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            attributes: logEntry.context,
            resource: {
              service: "bucket-list-app",
              version: "1.0.0",
            },
          }),
        })

        if (!response.ok) {
          console.error("Failed to send log to Dash0:", response.statusText)
        }
      } catch (error) {
        console.error("Error sending log to Dash0:", error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing log entry:", error)
    return NextResponse.json({ error: "Failed to process log entry" }, { status: 500 })
  }
}
