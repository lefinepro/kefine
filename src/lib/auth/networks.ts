import { mainnet, avalanche } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, avalanche];

export const defaultNetwork: AppKitNetwork = mainnet;
