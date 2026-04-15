import { proxyCreateOrder } from '$lib/server/order-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, fetch }) => proxyCreateOrder(request, fetch);
