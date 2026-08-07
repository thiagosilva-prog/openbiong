import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { link } from './link';

export const linkView = pgTable('link_view', {
  id: uuid('id').primaryKey().defaultRandom(),

  ip: text('ip').notNull(),
  userAgent: text('user_agent').notNull(),
  referrer: text('referrer'),
  country: varchar('country', { length: 2 }), // ISO 3166-1 alpha-2
  region: varchar('region', { length: 10 }), // ISO 3166-2 subdivision code
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
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

  linkId: uuid('link_id').notNull(),
});

export const linkViewRelations = relations(linkView, ({ one }) => ({
  link: one(link, {
    fields: [linkView.linkId],
    references: [link.id],
  }),
}));
