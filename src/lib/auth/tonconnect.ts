import { browser } from '$app/environment';

type TonConnectLike = {
  connected: boolean;
  account: {
    address: string;
    chain: string;
  } | null;
  restoreConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  getWallets: () => Promise<any[]>;
  onStatusChange: (
    callback: (wallet: { account: { address: string; chain: string } } | null) => void,
    errorsHandler?: (error: Error) => void
  ) => () => void;
  connect: (wallet: Record<string, unknown>) => string | void;
};

export type TonConnectSession = {
  address: string;
  chain: string | null;
};

let tonConnectPromise: Promise<TonConnectLike | null> | null = null;

async function ensureTonConnect(): Promise<TonConnectLike | null> {
  if (!browser) {
    return null;
  }

  tonConnectPromise ??= (async () => {
    const { TonConnect, isWalletInfoCurrentlyEmbedded, isWalletInfoInjected, isWalletInfoRemote } = await import('@tonconnect/sdk');
    const connector = new TonConnect({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
    }) as TonConnectLike;

    await connector.restoreConnection();
    const wallets = await connector.getWallets();

    const embeddedWallet = wallets.find((wallet) => isWalletInfoCurrentlyEmbedded(wallet));
    const injectedWallet = wallets.find((wallet) => isWalletInfoInjected(wallet));
    const remoteWallet =
      wallets.find((wallet) => isWalletInfoRemote(wallet) && String(wallet.appName || '').toLowerCase() === 'tonkeeper') ||
      wallets.find((wallet) => isWalletInfoRemote(wallet));

    return Object.assign(connector, {
      __preferredWallet: embeddedWallet || injectedWallet || remoteWallet || null
    });
  })();

  return tonConnectPromise;
}

function readSession(connector: TonConnectLike): TonConnectSession | null {
  if (!connector.connected || !connector.account?.address) {
    return null;
  }

  return {
    address: connector.account.address,
    chain: connector.account.chain || null
  };
}

export async function connectTonWallet(): Promise<TonConnectSession> {
  const connector = await ensureTonConnect();
  if (!connector) {
    throw new Error('TON Connect is unavailable.');
  }

  const existing = readSession(connector);
  if (existing) {
    return existing;
  }

  const preferredWallet = (connector as TonConnectLike & { __preferredWallet?: any }).__preferredWallet;
  if (!preferredWallet) {
    throw new Error('No TON wallet is available for TonConnect.');
  }

  const sessionPromise = new Promise<TonConnectSession>((resolve, reject) => {
    const unsubscribe = connector.onStatusChange(
      (wallet) => {
        if (!wallet?.account?.address) {
          return;
        }

        unsubscribe();
        resolve({
          address: wallet.account.address,
          chain: wallet.account.chain || null
        });
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });

  const universalLink = connector.connect(preferredWallet);
  if (typeof universalLink === 'string' && universalLink.trim()) {
    window.open(universalLink, '_blank', 'noopener,noreferrer');
  }

  return sessionPromise;
}

export async function disconnectTonWallet(): Promise<void> {
  const connector = await ensureTonConnect();
  await connector?.disconnect();
}
