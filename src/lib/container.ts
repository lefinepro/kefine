// Dependency injection container for service registration and resolution

type Constructor<T> = new (...args: unknown[]) => T;
type Factory<T> = () => T;

type Registration<T> = { kind: 'constructor'; ctor: Constructor<T> } | { kind: 'factory'; factory: Factory<T> } | { kind: 'value'; value: T };

export class Container {
	private readonly registry = new Map<string, Registration<unknown>>();
	private readonly singletons = new Map<string, unknown>();

	register<T>(token: string, registration: Registration<T>): void {
		this.registry.set(token, registration as Registration<unknown>);
	}

	registerConstructor<T>(token: string, ctor: Constructor<T>): void {
		this.register(token, { kind: 'constructor', ctor });
	}

	registerFactory<T>(token: string, factory: Factory<T>): void {
		this.register(token, { kind: 'factory', factory });
	}

	registerValue<T>(token: string, value: T): void {
		this.register(token, { kind: 'value', value });
	}

	resolve<T>(token: string): T {
		const registration = this.registry.get(token);
		if (!registration) {
			throw new Error(`No registration found for token: ${token}`);
		}

		if (this.singletons.has(token)) {
			return this.singletons.get(token) as T;
		}

		let instance: T;
		if (registration.kind === 'constructor') {
			instance = new (registration.ctor as Constructor<T>)();
		} else if (registration.kind === 'factory') {
			instance = (registration.factory as Factory<T>)();
		} else {
			instance = registration.value as T;
		}

		this.singletons.set(token, instance);
		return instance;
	}

	has(token: string): boolean {
		return this.registry.has(token);
	}

	clear(): void {
		this.registry.clear();
		this.singletons.clear();
	}
}

export const container = new Container();
