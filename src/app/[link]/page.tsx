import {
  defaultMetadata,
  ogMetadata,
  twitterMetadata,
} from '@/app/shared-metadata';
import OnboardingTour from '@/components/onboarding-tour';
import { Skeleton } from '@/components/ui/skeleton';
import { extractAttributionParams } from '@/lib/attribution';
import { api } from '@/trpc/server';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import ActionBar from './_components/action-bar';
import Bento from './_components/bento';
import { BentoHistoryProvider } from './_components/bento-history';
import ProfileLinkHeader from './_components/header';
import { PreviewProvider } from './_components/preview-context';
import ThemeWrapper from './_components/theme-wrapper';
import ViewportContainer from './_components/viewport-container';

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
    ttclid?: string
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
  const attribution = extractAttributionParams(
    toSearchParams(await searchParams)
  );

  const profileLink = await getProfileLink(
    link,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
    attribution.utmTerm,
    attribution.utmContent,
    attribution.fbclid,
    attribution.gclid,
    attribution.ttclid
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
  const attribution = extractAttributionParams(
    toSearchParams(await searchParams)
  );
  const profileLink = await getProfileLink(
    link,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
    attribution.utmTerm,
    attribution.utmContent,
    attribution.fbclid,
    attribution.gclid,
    attribution.ttclid
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
      <ThemeWrapper
        theme={profileLink.theme}
        darkMode={profileLink.darkMode}
        accentColor={profileLink.accentColor}
      >
        <PreviewProvider>
          <Suspense>
            <BentoHistoryProvider>
              <ViewportContainer>
                <div className="flex flex-col gap-y-6">
                  <div className="animate-fade-in">
                    <ProfileLinkHeader profileLink={profileLink} />
                  </div>

                  <Suspense
                    fallback={
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="aspect-square h-full w-full"
                          />
                        ))}
                      </div>
                    }
                  >
                    <Bento profileLink={profileLink} />
                  </Suspense>

                  {profileLink.isOwner && (
                    <>
                      <ActionBar />
                      <OnboardingTour />
                    </>
                  )}

                  <footer className="animate-fade-in py-8 text-center">
                    {profileLink.customFooter ? (
                      <p className="text-muted-foreground text-xs">
                        {profileLink.customFooter}
                      </p>
                    ) : (
                      <Link
                        href="/claim-link"
                        className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-4 py-2 text-muted-foreground text-sm backdrop-blur-sm transition-all hover:border-primary hover:text-foreground"
                      >
                        Create your own free page on
                        <span className="font-semibold text-foreground">
                          OpenBio
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </footer>
                </div>
              </ViewportContainer>
            </BentoHistoryProvider>
          </Suspense>
        </PreviewProvider>
      </ThemeWrapper>
    </>
  );
}
