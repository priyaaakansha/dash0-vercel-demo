import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    // Add your service name here instead of the placeholder
    serviceName: "dash0-vercel-demo",
    instrumentationConfig: {
      fetch: {
        // By default the context is only propagated for the deployment URLs, all other URLs should be enabled explicitly in the list by string prefix or regex.
        propagateContextUrls: ['https://dash0-vercel-demo.vercel.app/'],
      },
    },
  });
}