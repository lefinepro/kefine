import { proxyPaymentQuote } from '$lib/server/order-proxy';

export const GET = async ({ params, request, fetch }: { params: { id: string }; request: Request; fetch: typeof globalThis.fetch }) =>
  proxyPaymentQuote(request, params.id, fetch);
