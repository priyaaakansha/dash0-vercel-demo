import { registerOTel } from "@vercel/otel"

export function register() {
  registerOTel({
    serviceName: "bucket-list-app",
    serviceVersion: "1.0.0",
  })
}
