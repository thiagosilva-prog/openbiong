import { redis, safeCacheGet, safeCacheSet } from '@/lib/redis';
import { and, countDistinct, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import { linkClick, linkView } from '../schema';
import { getTotalViewsInWindow } from './link-view';
import { truncate } from './sanitize';

const CACHE_WINDOWS = [7, 30, 90];

type RecordLinkClickInput = {
  bentoId: string;
  href: string;
  ip: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  region?: string;
  city?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
};

export const recordLinkClick = async (
  linkId: string,
  {
    bentoId,
    href,
    ip,
    userAgent,
    referrer,
    country,
    region,
    city,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    fbclid,
    gclid,
    ttclid,
  }: RecordLinkClickInput
) => {
  await db.insert(linkClick).values({
    linkId,
    bentoId,
    href,
    ip,
    userAgent,
    referrer,
    country,
    region: truncate(region, 10),
    city: truncate(city),
    utmSource: truncate(utmSource),
    utmMedium: truncate(utmMedium),
    utmCampaign: truncate(utmCampaign),
    utmTerm: truncate(utmTerm),
    utmContent: truncate(utmContent),
    fbclid: truncate(fbclid),
    gclid: truncate(gclid),
    ttclid: truncate(ttclid),
  });

  // Cache invalidation is best-effort: a Redis outage shouldn't prevent the
  // click from being recorded.
  try {
    await Promise.all([
      redis.del(`profile-link-clicks:${linkId}`),
      ...CACHE_WINDOWS.flatMap((days) => [
        redis.del(`analytics:clicks-over-time:${linkId}:${days}`),
        redis.del(`analytics:card-stats:${linkId}:${days}`),
        redis.del(`analytics:period-comparison:${linkId}:${days}`),
      ]),
    ]);
  } catch {
    // ignore — see comment above
  }
};

export const getViewsOverTime = async (linkId: string, days: number) => {
  const cacheKey = `analytics:views-over-time:${linkId}:${days}`;
  const cached =
    await safeCacheGet<{ date: string; count: number }[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${linkView.createdAt})::date`.as(
        'date'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkView)
    .where(
      and(
        eq(linkView.linkId, linkId),
        gte(linkView.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`date_trunc('day', ${linkView.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${linkView.createdAt})::date`);

  const result = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getClicksOverTime = async (linkId: string, days: number) => {
  const cacheKey = `analytics:clicks-over-time:${linkId}:${days}`;
  const cached =
    await safeCacheGet<{ date: string; count: number }[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${linkClick.createdAt})::date`.as(
        'date'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkClick)
    .where(
      and(
        eq(linkClick.linkId, linkId),
        gte(linkClick.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`date_trunc('day', ${linkClick.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${linkClick.createdAt})::date`);

  const result = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getCardStats = async (linkId: string, days: number) => {
  const cacheKey = `analytics:card-stats:${linkId}:${days}`;
  const cached =
    await safeCacheGet<
      { href: string; title?: string; clicks: number; ctr: number }[]
    >(cacheKey);
  if (cached) {
    return cached;
  }

  // Grouped by href alone, not (bentoId, href): historically a card's
  // bentoId could be regenerated on save (via the now-removed basic-info
  // edit form), fragmenting one link's click history across every id it
  // has ever had — grouping by href stays correct regardless.
  const [rows, totalViews, profileLink] = await Promise.all([
    db
      .select({
        href: linkClick.href,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(linkClick)
      .where(
        and(
          eq(linkClick.linkId, linkId),
          gte(linkClick.createdAt, sql`now() - ${`${days} days`}::interval`)
        )
      )
      .groupBy(linkClick.href)
      .orderBy(desc(sql`count(*)`))
      .limit(200),
    getTotalViewsInWindow(linkId, days),
    db.query.link.findFirst({
      where: (_link, { eq: eqOp }) => eqOp(_link.id, linkId),
      columns: { bento: true },
    }),
  ]);

  const titleByHref = new Map<string, string>();
  for (const b of profileLink?.bento ?? []) {
    if (b.type === 'link' && b.href && b.title) {
      titleByHref.set(b.href, b.title);
    }
  }

  const result = rows.map((r) => {
    const clicks = Number(r.count);
    return {
      href: r.href,
      title: titleByHref.get(r.href),
      clicks,
      ctr: totalViews > 0 ? clicks / totalViews : 0,
    };
  });
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getTopReferrers = async (linkId: string, days: number) => {
  const cacheKey = `analytics:top-referrers:${linkId}:${days}`;
  const cached =
    await safeCacheGet<{ referrer: string; count: number }[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      referrer: sql<string>`coalesce(${linkView.referrer}, 'Direto')`.as(
        'referrer'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkView)
    .where(
      and(
        eq(linkView.linkId, linkId),
        gte(linkView.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`coalesce(${linkView.referrer}, 'Direto')`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const result = rows.map((r) => ({
    referrer: r.referrer,
    count: Number(r.count),
  }));
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getTotalClicks = async (linkId: string) => {
  const cached = await safeCacheGet<number | null>(
    `profile-link-clicks:${linkId}`
  );
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(linkClick)
    .where(eq(linkClick.linkId, linkId));

  const count = Number(rows[0]?.count ?? 0);
  await safeCacheSet(`profile-link-clicks:${linkId}`, count, { ex: 30 * 60 });
  return count;
};

type PeriodMetric = { current: number; previous: number };

export type PeriodComparison = {
  views: PeriodMetric;
  uniqueViews: PeriodMetric;
  clicks: PeriodMetric;
};

// Compares the selected window against the equal-length window right before
// it (e.g. last 30 days vs. the 30 days before that), powering the trend
// arrows on the summary cards.
export const getPeriodComparison = async (
  linkId: string,
  days: number
): Promise<PeriodComparison> => {
  const cacheKey = `analytics:period-comparison:${linkId}:${days}`;
  const cached = await safeCacheGet<PeriodComparison>(cacheKey);
  if (cached) {
    return cached;
  }

  const now = new Date();
  const currentSince = new Date(now);
  currentSince.setDate(currentSince.getDate() - days);
  const previousSince = new Date(now);
  previousSince.setDate(previousSince.getDate() - days * 2);

  const [
    currentViews,
    previousViews,
    currentUnique,
    previousUnique,
    currentClicks,
    previousClicks,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(linkView)
      .where(
        and(eq(linkView.linkId, linkId), gte(linkView.createdAt, currentSince))
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(linkView)
      .where(
        and(
          eq(linkView.linkId, linkId),
          gte(linkView.createdAt, previousSince),
          lt(linkView.createdAt, currentSince)
        )
      ),
    db
      .select({ count: countDistinct(linkView.ip) })
      .from(linkView)
      .where(
        and(eq(linkView.linkId, linkId), gte(linkView.createdAt, currentSince))
      ),
    db
      .select({ count: countDistinct(linkView.ip) })
      .from(linkView)
      .where(
        and(
          eq(linkView.linkId, linkId),
          gte(linkView.createdAt, previousSince),
          lt(linkView.createdAt, currentSince)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(linkClick)
      .where(
        and(
          eq(linkClick.linkId, linkId),
          gte(linkClick.createdAt, currentSince)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(linkClick)
      .where(
        and(
          eq(linkClick.linkId, linkId),
          gte(linkClick.createdAt, previousSince),
          lt(linkClick.createdAt, currentSince)
        )
      ),
  ]);

  const result: PeriodComparison = {
    views: {
      current: Number(currentViews[0]?.count ?? 0),
      previous: Number(previousViews[0]?.count ?? 0),
    },
    uniqueViews: {
      current: Number(currentUnique[0]?.count ?? 0),
      previous: Number(previousUnique[0]?.count ?? 0),
    },
    clicks: {
      current: Number(currentClicks[0]?.count ?? 0),
      previous: Number(previousClicks[0]?.count ?? 0),
    },
  };

  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};
