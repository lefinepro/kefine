import { describe, expect, test } from 'vitest';
import { readTaskRouteStateFromLocation } from './kefine-workspace-helpers';

/**
 * Build a minimal Location-like object. `readTaskRouteStateFromLocation` only
 * reads `pathname` and `hash`, so the rest of the interface is unused here.
 */
function loc(pathname: string, hash = ''): Location {
  return { pathname, hash } as Location;
}

describe('readTaskRouteStateFromLocation', () => {
  test('resolves the canonical /order/[id] route', () => {
    expect(readTaskRouteStateFromLocation(loc('/order/order-1'))).toEqual({
      orderId: 'order-1',
      view: null
    });
  });

  test('keeps the bare-hash result/stages view on the canonical route', () => {
    expect(readTaskRouteStateFromLocation(loc('/order/order-1', '#result'))).toEqual({
      orderId: 'order-1',
      view: 'result'
    });
    expect(readTaskRouteStateFromLocation(loc('/order/order-1', '#stages'))).toEqual({
      orderId: 'order-1',
      view: 'stages'
    });
  });

  test('resolves the hash navigation format with an inline view', () => {
    expect(readTaskRouteStateFromLocation(loc('/order/order-1', '#/orders/order-1/stages'))).toEqual({
      orderId: 'order-1',
      view: 'stages'
    });
  });

  test('strips a locale prefix before matching the order route', () => {
    expect(readTaskRouteStateFromLocation(loc('/ru/order/order-1'))).toEqual({
      orderId: 'order-1',
      view: null
    });
  });

  test('still resolves the legacy /task/[id] prefix', () => {
    expect(readTaskRouteStateFromLocation(loc('/task/order-1'))).toEqual({
      orderId: 'order-1',
      view: null
    });
  });

  test('no longer treats the removed actor-scoped routes as orders', () => {
    // These routes were consolidated into /order/[id] and deleted.
    expect(readTaskRouteStateFromLocation(loc('/@api/order-1'))).toBeNull();
    expect(readTaskRouteStateFromLocation(loc('/@api/order/order-1'))).toBeNull();
    expect(readTaskRouteStateFromLocation(loc('/@api/orders/order-1'))).toBeNull();
  });

  test('does not parse a phantom order from a widget or profile route', () => {
    expect(readTaskRouteStateFromLocation(loc('/@api/weather'))).toBeNull();
    expect(readTaskRouteStateFromLocation(loc('/@api'))).toBeNull();
    expect(readTaskRouteStateFromLocation(loc('/'))).toBeNull();
  });
});
