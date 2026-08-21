import {
  defaultMetadata,
  ogMetadata,
  twitterMetadata,
} from '@/app/shared-metadata';
import { extractAttributionParams } from '@/lib/attribution';
import { api } from '@/trpc/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import MetaPixel from './_components/meta-pixel';
import { PreviewProvider } from './_components/preview-context';
import ProfileBody from './_components/profile-body';
import ThemeWrapper from './_components/theme-wrapper';

type Props = {
  params: Promise<{
    link: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// getProfileLink is memoized by React's cache() per request, keyed on its
// arguments. It's called from both generateMetadata and Page — passing a
// freshly-built object each time (instead of primitives) would defeat the
// memoization, since two object literals with equal contents aren't
// Object.is-equal, causing getByLink (and its view-recording side effect) to
// fire twice per request.
const getProfileLink = cache(
  (
    link: string,
    utmSource?: string,
    utmMedium?: string,
    utmCampaign?: string,
    utmTerm?: string,
    utmContent?: string,
    fbclid?: string,
    gclid?: string,
    ttclid?: string,
    editSession?: boolean
  ) => {
    return api.profileLink.getByLink({
      link,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      fbclid,
      gclid,
      ttclid,
      editSession,
    });
  }
);

function toSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      sp.set(key, value);
    } else if (Array.isArray(value) && value[0] !== undefined) {
      sp.set(key, value[0]);
    }
  }
  return sp;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { link } = await params;
  const resolvedSearchParams = await searchParams;
  const attribution = extractAttributionParams(
    toSearchParams(resolvedSearchParams)
  );
  const editRequested = resolvedSearchParams.edit === '1';

  const profileLink = await getProfileLink(
    link,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
    attribution.utmTerm,
    attribution.utmContent,
    attribution.fbclid,
    attribution.gclid,
    attribution.ttclid,
    editRequested
  );

  const title = profileLink?.name ?? defaultMetadata.title;
  const description = (
    profileLink?.bio ??
    `This is ${profileLink?.name ?? profileLink?.link}'s profile.`
  ).replace(/<[^>]*>/g, '');

  return {
    ...defaultMetadata,
    title,
    description,
    twitter: {
      ...twitterMetadata,
      title,
      description,
      images: [`/api/og?title=${title}&description=${description}`],
    },
    openGraph: {
      ...ogMetadata,
      title,
      description,
      images: [`/api/og?title=${title}&description=${description}`],
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { link } = await params;
  const resolvedSearchParams = await searchParams;
  const attribution = extractAttributionParams(
    toSearchParams(resolvedSearchParams)
  );
  const editRequested = resolvedSearchParams.edit === '1';
  const profileLink = await getProfileLink(
    link,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
    attribution.utmTerm,
    attribution.utmContent,
    attribution.fbclid,
    attribution.gclid,
    attribution.ttclid,
    editRequested
  );

  if (!profileLink) {
    notFound();
  }

  const bio = (profileLink.bio ?? '').replace(/<[^>]*>/g, '');
  const profileUrl = `https://openbio.app/${profileLink.link}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profileLink.name,
      url: profileUrl,
      ...(profileLink.image && { image: profileLink.image }),
      ...(bio && { description: bio }),
      sameAs: profileLink.bento
        .filter((b) => b.type === 'link' && b.href)
        .map((b) => (b as { href: string }).href),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD with server-only data from our DB
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!editRequested && profileLink.metaPixelId && (
        <MetaPixel
          pixelId={profileLink.metaPixelId}
          eventId={profileLink.metaPixelEventId}
        />
      )}
      <ThemeWrapper
        theme={profileLink.theme}
        darkMode={profileLink.darkMode}
        accentColor={profileLink.accentColor}
        backgroundImage={profileLink.backgroundImage}
      >
        <PreviewProvider
          initialPreview={!editRequested}
          editSession={editRequested}
        >
          <Suspense>
            <ProfileBody profileLink={profileLink} />
          </Suspense>
        </PreviewProvider>
      </ThemeWrapper>
    </>
  );
}
