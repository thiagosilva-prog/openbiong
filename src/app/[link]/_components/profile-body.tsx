'use client';

import OnboardingTour from '@/components/onboarding-tour';
import { Skeleton } from '@/components/ui/skeleton';
import type { RouterOutputs } from '@/trpc/react';
import { Suspense } from 'react';
import ActionBar from './action-bar';
import Bento from './bento';
import { BentoHistoryProvider } from './bento-history';
import ProfileLinkHeader from './header';
import { usePreview } from './preview-context';
import ViewportContainer from './viewport-container';

type ProfileLinkData = NonNullable<RouterOutputs['profileLink']['getByLink']>;

const gridSkeleton = (
  <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
    {Array.from({ length: 24 }).map((_, i) => (
      <Skeleton key={i} className="aspect-square h-full w-full" />
    ))}
  </div>
);

// The owner's only way back into the editor while a blank page is showing
// its chrome-free public view — without it, "Página em Branco" would strand
// the owner outside the single editor this app is built around.
function ExitBlankPreviewButton() {
  const { setPreview } = usePreview();
  return (
    <button
      type="button"
      onClick={() => setPreview(false)}
      className="fixed top-4 right-4 z-50 rounded-lg border border-border/50 bg-background/90 px-3 py-1.5 text-xs shadow-md backdrop-blur-sm transition-colors hover:bg-accent"
    >
      Editar
    </button>
  );
}

export default function ProfileBody({
  profileLink,
}: {
  profileLink: ProfileLinkData;
}) {
  const { preview } = usePreview();
  const hideChrome = profileLink.blankPage && preview;

  return (
    <BentoHistoryProvider>
      {hideChrome ? (
        <>
          <div className="fixed inset-0">
            <Suspense fallback={null}>
              <Bento profileLink={profileLink} />
            </Suspense>
          </div>
          {profileLink.isOwner && <ExitBlankPreviewButton />}
        </>
      ) : (
        <ViewportContainer>
          <div className="flex flex-col gap-y-6">
            <div className="animate-fade-in">
              <ProfileLinkHeader profileLink={profileLink} />
            </div>

            <Suspense fallback={gridSkeleton}>
              <Bento profileLink={profileLink} />
            </Suspense>

            {profileLink.isOwner && (
              <>
                <ActionBar />
                <OnboardingTour />
              </>
            )}

            {profileLink.customFooter && (
              <footer className="animate-fade-in py-8 text-center">
                <p className="text-muted-foreground text-xs">
                  {profileLink.customFooter}
                </p>
              </footer>
            )}
          </div>
        </ViewportContainer>
      )}
    </BentoHistoryProvider>
  );
}
