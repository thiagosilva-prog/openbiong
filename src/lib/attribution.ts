export type AttributionParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
};

export function extractAttributionParams(
  searchParams: URLSearchParams
): AttributionParams {
  return {
    utmSource: searchParams.get('utm_source') ?? undefined,
    utmMedium: searchParams.get('utm_medium') ?? undefined,
    utmCampaign: searchParams.get('utm_campaign') ?? undefined,
    utmTerm: searchParams.get('utm_term') ?? undefined,
    utmContent: searchParams.get('utm_content') ?? undefined,
    fbclid: searchParams.get('fbclid') ?? undefined,
    gclid: searchParams.get('gclid') ?? undefined,
    ttclid: searchParams.get('ttclid') ?? undefined,
  };
}
