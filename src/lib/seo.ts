import type { LegalPageId } from '$lib/constants/legal-content';
import {
  DEFAULT_PUBLIC_RUNTIME_CONFIG,
  resolvePublicRuntimeConfig,
  type KefinePublicRuntimeConfig
} from '$lib/config/public-config';

export type SeoMeta = {
  title: string;
  description: string;
  robots: string;
  canonicalPath: string;
  imagePath: string;
  type: 'website' | 'article';
  jsonLd: Record<string, unknown>;
};

const DEFAULT_TITLE = 'Lefine | From task to best-fit solution.';
const DEFAULT_DESCRIPTION =
  'Lefine is an Automated Freelance Marketplace: you describe the task, and we match the solution path that fits it best.';
const DEFAULT_IMAGE_PATH = '/og-card.svg';

function resolveLegalMeta(pathname: string): { id: LegalPageId; title: string; description: string } | null {
  if (pathname === '/privacy') {
    return {
      id: 'privacy',
      title: 'Privacy Policy | Lefine',
      description: 'Read how Lefine collects, uses, stores, and protects personal data across tasks, payments, and authentication.'
    };
  }

  if (pathname === '/terms') {
    return {
      id: 'terms',
      title: 'Terms of Service | Lefine',
      description: 'Review the legal terms for using Lefine, including task creation, solver workflows, payments, and digital delivery.'
    };
  }

  if (pathname === '/legal-information') {
    return {
      id: 'company',
      title: 'Legal Information | Lefine',
      description: 'Review Lefine company details, contact information, payment disclosures, and legal notices.'
    };
  }

  return null;
}

function buildOrganizationJsonLd(origin: string, publicConfig: KefinePublicRuntimeConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: publicConfig.company.legalName || publicConfig.app.name,
    url: origin,
    logo: `${origin}/favicon.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: publicConfig.company.email || publicConfig.app.supportEmail
    }
  };
}

function isActorOrderPath(pathname: string): boolean {
  return /^\/@[^/]+\/order\/[^/]+$/i.test(pathname);
}

export function getSeoMeta(url: URL, sourceConfig: unknown = DEFAULT_PUBLIC_RUNTIME_CONFIG): SeoMeta {
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const publicConfig = resolvePublicRuntimeConfig(sourceConfig);
  const legalMeta = resolveLegalMeta(pathname);

  if (legalMeta) {
    return {
      title: legalMeta.title,
      description: legalMeta.description,
      robots: 'index,follow,max-image-preview:large',
      canonicalPath: pathname,
      imagePath: DEFAULT_IMAGE_PATH,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: legalMeta.title,
        description: legalMeta.description,
        url: `${url.origin}${pathname}`,
        isPartOf: {
          '@type': 'WebSite',
          name: publicConfig.app.name,
          url: url.origin
        }
      }
    };
  }

  const isTaskFlow =
    pathname === '/create' ||
    pathname === '/api/create' ||
    pathname.startsWith('/task/') ||
    pathname.startsWith('/order/') ||
    isActorOrderPath(pathname) ||
    pathname.startsWith('/payment/') ||
    pathname.startsWith('/api/payment/') ||
    pathname.startsWith('/pay/') ||
    pathname.startsWith('/api/pay/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/status' ||
    pathname.startsWith('/status/') ||
    pathname === '/api/status' ||
    pathname.startsWith('/api/status/') ||
    pathname === '/api/payment-config' ||
    pathname.startsWith('/api/services') ||
    pathname.startsWith('/passkeys/') ||
    pathname.startsWith('/api/kefine/');

  if (isTaskFlow) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      robots: 'noindex,nofollow',
      canonicalPath: pathname,
      imagePath: DEFAULT_IMAGE_PATH,
      type: 'website',
      jsonLd: buildOrganizationJsonLd(url.origin, publicConfig)
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    robots: 'index,follow,max-image-preview:large',
    canonicalPath: '/',
    imagePath: DEFAULT_IMAGE_PATH,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: publicConfig.app.name,
      description: DEFAULT_DESCRIPTION,
      url: url.origin,
      publisher: buildOrganizationJsonLd(url.origin, publicConfig)
    }
  };
}
