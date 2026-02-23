// Configuration management for the Kefine OKR application

export interface Config {
	rpName: string;
	rpId: string;
	origin: string;
	activityPubBaseUrl: string;
	forgeFedBaseUrl: string;
	enablePasskeyAuth: boolean;
	enableFederation: boolean;
}

const defaultConfig: Config = {
	rpName: 'Kefine OKR',
	rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
	origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
	activityPubBaseUrl: '',
	forgeFedBaseUrl: '',
	enablePasskeyAuth: false,
	enableFederation: false
};

let currentConfig: Config = { ...defaultConfig };

export function getConfig(): Readonly<Config> {
	return currentConfig;
}

export function setConfig(partial: Partial<Config>): void {
	currentConfig = { ...currentConfig, ...partial };
}

export function resetConfig(): void {
	currentConfig = { ...defaultConfig };
}
