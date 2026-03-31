import { p as proxyCraterRequest } from './crater-proxy-C1bmVULX.js';

//#region src/lib/server/order-proxy.ts
async function proxyCreateOrder(request, fetchFn) {
	return proxyCraterRequest(request, fetchFn, "/create", { errorMessage: "Failed to reach crater." });
}
async function proxyOrderStatus(request, orderPath, fetchFn, orderId) {
	return proxyCraterRequest(request, fetchFn, orderPath, {
		errorMessage: "Failed to reach crater.",
		context: orderId ? { orderId } : void 0
	});
}
async function proxyPaymentQuote(request, orderId, fetchFn) {
	return proxyCraterRequest(request, fetchFn, `/payment/${encodeURIComponent(orderId)}`, {
		errorMessage: "Failed to load payment quote.",
		context: { orderId }
	});
}
async function proxyPaymentConfig(request, fetchFn) {
	return proxyCraterRequest(request, fetchFn, "/payment-config", { errorMessage: "Failed to load payment config." });
}
async function proxyPaymentPromo(request, orderId, fetchFn) {
	return proxyCraterRequest(request, fetchFn, `/payment/${encodeURIComponent(orderId)}/promo`, {
		errorMessage: "Failed to apply promo code.",
		context: { orderId }
	});
}

export { proxyOrderStatus as a, proxyPaymentConfig as b, proxyPaymentQuote as c, proxyPaymentPromo as d, proxyCreateOrder as p };
//# sourceMappingURL=order-proxy-BWRu83gC.js.map
