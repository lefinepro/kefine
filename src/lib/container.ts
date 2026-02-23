/**
 * Dependency injection container for federation services
 * OKR-013.3 Task 1.3.2
 *
 * Provides a lightweight service registry for the AP/ForgeFed integration modules.
 */

import type { FederationConfig } from './config';
import { loadConfig } from './config';
import { loadAPSession } from './auth/session';
import { apObjectCache } from './activitypub/cache';

/** Service identifiers */
export type ServiceId =
  | 'config'
  | 'session'
  | 'apObjectCache'
  | 'activityPubClient'
  | 'forgeFedAdapter'
  | 'orgParser'
  | 'passkeyAuth'
  | 'syncManager';

type ServiceFactory<T> = () => T;

/** Simple service registry */
class Container {
  private readonly factories = new Map<string, ServiceFactory<unknown>>();
  private readonly singletons = new Map<string, unknown>();

  /**
   * Register a service factory (singleton by default)
   */
  register<T>(id: ServiceId, factory: ServiceFactory<T>): void {
    this.factories.set(id, factory as ServiceFactory<unknown>);
  }

  /**
   * Resolve a registered service (creates singleton on first access)
   */
  resolve<T>(id: ServiceId): T {
    if (this.singletons.has(id)) {
      return this.singletons.get(id) as T;
    }

    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Service not registered: ${id}`);
    }

    const instance = factory();
    this.singletons.set(id, instance);
    return instance as T;
  }

  /**
   * Reset all singleton instances (useful for testing)
   */
  reset(): void {
    this.singletons.clear();
  }
}

/** Global container instance */
export const container = new Container();

/**
 * Initialize the container with default service registrations
 */
export function initContainer(): void {
  // Config service
  container.register('config', () => loadConfig());

  // Object cache
  container.register('apObjectCache', () => apObjectCache);

  // Session initialization (side effect: loads from localStorage)
  container.register('session', () => {
    loadAPSession();
    return null;
  });
}

/**
 * Get the current federation config from the container
 */
export function getConfig(): FederationConfig {
  return container.resolve<FederationConfig>('config');
}
