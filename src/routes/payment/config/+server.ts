import { proxyPaymentConfig } from '$lib/server/order-proxy';

export const GET = async ({ request, fetch }: { request: Request; fetch: typeof globalThis.fetch }) =>
  proxyPaymentConfig(request, fetch);
