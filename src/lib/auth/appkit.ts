import { browser } from '$app/environment';

const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined)?.trim() || '909acf523be03f300ad21cca95d966c8';

const metadata = {
	name: 'Lefine - Automated Freelance Exchange',
	description: 'Automated freelance exchange dashboard',
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
	subscribeAccount: (callback: (account: any) => void) => (() => void) | void;
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
		const scopedGlobal = globalThis as typeof globalThis & { Buffer?: unknown };
		if (typeof scopedGlobal.Buffer === 'undefined') {
			const { Buffer } = await import('buffer');
			scopedGlobal.Buffer = Buffer;
		}

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

export async function subscribeToAppKitAccount(callback: (account: any) => void): Promise<(() => void) | void> {
	const instance = await ensureAppKit();
	return instance?.subscribeAccount(callback);
}

export type ReownAccountState = {
	isConnected: boolean;
	address: string | null;
	chainId: number | null;
	email: string | null;
	authType: 'wallet' | 'email' | null;
	status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | null;
};

export async function readReownAccountState(): Promise<ReownAccountState> {
	await ensureAppKit();

	if (!wagmiAdapter?.wagmiConfig) {
		return {
			isConnected: false,
			address: null,
			chainId: null,
			email: null,
			authType: null,
			status: 'disconnected'
		};
	}

	const { getAccount } = await import('@wagmi/core');
	const account = getAccount(wagmiAdapter.wagmiConfig) as {
		address?: string;
		chainId?: number;
		isConnected?: boolean;
		status?: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | null;
		addresses?: string[];
		connector?: {
			id?: string;
			name?: string;
		};
	};

	const address = typeof account.address === 'string' ? account.address : account.addresses?.[0] ?? null;
	const connectorName = account.connector?.name?.toLowerCase() ?? '';
	const isEmailSession = connectorName.includes('email');

	return {
		isConnected: Boolean(account.isConnected && address),
		address,
		chainId: typeof account.chainId === 'number' ? account.chainId : null,
		email: null,
		authType: isEmailSession ? 'email' : address ? 'wallet' : null,
		status: account.status ?? (account.isConnected ? 'connected' : 'disconnected')
	};
}

export async function syncAppKitTheme(theme: KefineTheme): Promise<void> {
	if (!appkit) return;
	appkit.setThemeMode(theme);
	appkit.setThemeVariables(getThemeVariables(theme));
}

export class ReownPaymentError extends Error {
	code: 'wallet_not_connected' | 'payment_config_invalid';

	constructor(code: 'wallet_not_connected' | 'payment_config_invalid', message: string) {
		super(message);
		this.name = 'ReownPaymentError';
		this.code = code;
	}
}

type ReownErc20PaymentParams = {
	chainId: number;
	tokenAddress: `0x${string}`;
	recipientAddress: `0x${string}`;
	amount: number;
	decimals: number;
};

export async function payWithReownErc20Transfer(params: ReownErc20PaymentParams): Promise<`0x${string}`> {
	if (!Number.isFinite(params.amount) || params.amount <= 0) {
		throw new ReownPaymentError('payment_config_invalid', 'Payment amount is invalid.');
	}

	await ensureAppKit();

	if (!wagmiAdapter?.wagmiConfig) {
		throw new ReownPaymentError('wallet_not_connected', 'Wallet is not ready.');
	}

	const [{ getAccount, switchChain, waitForTransactionReceipt, writeContract }, { erc20Abi, parseUnits }] = await Promise.all([
		import('@wagmi/core'),
		import('viem')
	]);

	const account = getAccount(wagmiAdapter.wagmiConfig);
	if (!account.isConnected || !account.address) {
		throw new ReownPaymentError('wallet_not_connected', 'Connect a wallet to continue with Reown payment.');
	}

	if (account.chainId !== params.chainId) {
		await switchChain(wagmiAdapter.wagmiConfig, { chainId: params.chainId });
	}

	const value = parseUnits(params.amount.toString(), params.decimals);
	const hash = await writeContract(wagmiAdapter.wagmiConfig, {
		address: params.tokenAddress,
		abi: erc20Abi,
		functionName: 'transfer',
		args: [params.recipientAddress, value],
		account: account.address
	});

	await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash, timeout: 25_000 });
	return hash;
}
