import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: "vercel-nextjs-demo",
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: [],
      },
    },
  });
}
