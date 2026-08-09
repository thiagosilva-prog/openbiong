'use client';

import Script from 'next/script';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const PIXEL_ID_RE = /^\d+$/;

export default function MetaPixel({
  pixelId,
  eventId,
}: {
  pixelId: string;
  eventId: string;
}) {
  // pixelId is stored per-profile and rendered into every visitor's page as
  // inline JS below — never interpolate it unvalidated, or a crafted value
  // saved by a page owner becomes stored XSS against that page's visitors.
  if (!PIXEL_ID_RE.test(pixelId)) {
    return null;
  }

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', ${JSON.stringify(pixelId)});
        fbq('track', 'PageView', {}, {eventID: ${JSON.stringify(eventId)}});
      `}
    </Script>
  );
}
