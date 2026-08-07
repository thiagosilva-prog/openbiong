import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { link } from './link';

export const linkClick = pgTable('link_click', {
  id: uuid('id').primaryKey().defaultRandom(),

  bentoId: text('bento_id').notNull(),
  href: text('href').notNull(),

  ip: text('ip').notNull(),
  userAgent: text('user_agent').notNull(),
  referrer: text('referrer'),
  country: varchar('country', { length: 2 }),
  region: varchar('region', { length: 10 }),
  city: text('city'),

  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  fbclid: text('fbclid'),
  gclid: text('gclid'),
  ttclid: text('ttclid'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  linkId: uuid('link_id').notNull(),
});

export const linkClickRelations = relations(linkClick, ({ one }) => ({
  link: one(link, {
    fields: [linkClick.linkId],
    references: [link.id],
  }),
}));
