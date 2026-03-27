import type { RequestHandler } from './$types';
import { proxyCreateOrder } from '$lib/server/order-proxy';

export const POST: RequestHandler = async ({ request, fetch }) => proxyCreateOrder(request, fetch);
