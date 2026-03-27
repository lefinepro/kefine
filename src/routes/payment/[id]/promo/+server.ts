import { proxyPaymentPromo } from '$lib/server/order-proxy';

export const POST = async ({ params, request, fetch }: { params: { id: string }; request: Request; fetch: typeof globalThis.fetch }) =>
  proxyPaymentPromo(request, params.id, fetch);
