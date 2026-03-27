import { browser } from '$app/environment';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string;

const metadata = {
	name: 'Kefine Solver Exchange',
	description: 'Solver task exchange dashboard',
	url: typeof window !== 'undefined' ? window.location.origin : 'https://kefine.app',
	icons: ['https://kefine.app/favicon.png']
};

const KEFINE_THEME_LIGHT = {
	'--w3m-font-family': 'Manrope, system-ui, sans-serif',
	'--w3m-accent': '#7a4b2a',
	'--w3m-color-mix': '#2e2317',
	'--w3m-color-mix-strength': 12,
	'--w3m-border-radius-master': '8px',
	'--w3m-font-size-master': '9px',
	'--apkt-font-family': 'Manrope, system-ui, sans-serif',
	'--apkt-accent': '#7a4b2a',
	'--apkt-color-mix': '#2e2317',
	'--apkt-color-mix-strength': 12,
	'--apkt-border-radius-master': '8px',
	'--apkt-font-size-master': '9px'
} as const;

const KEFINE_THEME_DARK = {
	'--w3m-font-family': 'Manrope, system-ui, sans-serif',
	'--w3m-accent': '#c89a5a',
	'--w3m-color-mix': '#e7d6b7',
	'--w3m-color-mix-strength': 16,
	'--w3m-border-radius-master': '8px',
	'--w3m-font-size-master': '9px',
	'--apkt-font-family': 'Manrope, system-ui, sans-serif',
	'--apkt-accent': '#c89a5a',
	'--apkt-color-mix': '#e7d6b7',
	'--apkt-color-mix-strength': 16,
	'--apkt-border-radius-master': '8px',
	'--apkt-font-size-master': '9px'
} as const;

type KefineTheme = 'light' | 'dark';

type AppKitLike = {
	open: () => void;
	disconnect: () => Promise<void> | void;
	setThemeMode: (theme: KefineTheme) => void;
	setThemeVariables: (vars: Record<string, string | number>) => void;
	subscribeAccount: (callback: (account: any) => void) => void;
};

function detectThemeMode(): KefineTheme {
	if (typeof document !== 'undefined') {
		const htmlTheme = document.documentElement.getAttribute('data-kefine-theme');
		if (htmlTheme === 'dark' || htmlTheme === 'light') {
			return htmlTheme;
		}
	}

	if (typeof window !== 'undefined') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	return 'light';
}

function getThemeVariables(theme: KefineTheme) {
	return theme === 'dark' ? KEFINE_THEME_DARK : KEFINE_THEME_LIGHT;
}

export let wagmiAdapter: any = undefined;
export let appkit: AppKitLike | undefined = undefined;

let initPromise: Promise<AppKitLike | undefined> | null = null;

export async function ensureAppKit(): Promise<AppKitLike | undefined> {
	if (!browser) return undefined;
	if (appkit) return appkit;

	initPromise ??= (async () => {
		const [{ createAppKit }, { WagmiAdapter }, { networks, defaultNetwork }] = await Promise.all([
			import('@reown/appkit'),
			import('@reown/appkit-adapter-wagmi'),
			import('./networks.js')
		]);

		const initialTheme = detectThemeMode();
		wagmiAdapter = new WagmiAdapter({
			networks,
			projectId
		});

		appkit = createAppKit({
			adapters: [wagmiAdapter],
			networks,
			defaultNetwork,
			projectId,
			metadata,
			features: {
				analytics: true,
				email: true,
				socials: ['google', 'github']
			},
			themeMode: initialTheme,
			themeVariables: getThemeVariables(initialTheme)
		}) as AppKitLike;

		return appkit;
	})();

	return initPromise;
}

export async function openAppKit(): Promise<void> {
	const instance = await ensureAppKit();
	instance?.open();
}

export async function disconnectAppKit(): Promise<void> {
	const instance = await ensureAppKit();
	await instance?.disconnect?.();
}

export async function subscribeToAppKitAccount(callback: (account: any) => void): Promise<void> {
	const instance = await ensureAppKit();
	instance?.subscribeAccount(callback);
}

export async function syncAppKitTheme(theme: KefineTheme): Promise<void> {
	if (!appkit) return;
	appkit.setThemeMode(theme);
	appkit.setThemeVariables(getThemeVariables(theme));
}
