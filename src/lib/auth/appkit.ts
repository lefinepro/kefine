import { browser } from '$app/environment';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { networks, defaultNetwork } from './networks.js';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string;

const metadata = {
	name: 'Kefine OKR Dashboard',
	description: 'OKR-focused task dashboard',
	url: typeof window !== 'undefined' ? window.location.origin : 'https://kefine.app',
	icons: ['https://kefine.app/favicon.png']
};

export let wagmiAdapter: WagmiAdapter | undefined = undefined;
export let appkit: ReturnType<typeof createAppKit> | undefined = undefined;

if (browser) {
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
			socials: false
		},
		themeMode: 'light'
	});
}
