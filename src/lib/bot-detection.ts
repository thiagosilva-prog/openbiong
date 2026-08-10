// Known crawlers/link-preview fetchers and CLI/HTTP-client tools. These hit
// the page like a visitor would but aren't a person — most notably
// facebookexternalhit and WhatsApp, which fetch the URL once to build a link
// preview card every time someone shares or pastes the bio link, and can
// otherwise dominate "visitor location" stats with the crawler's own
// data-center city instead of any real visitor's.
const BOT_USER_AGENT_RE =
  /bot|crawl|spider|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|redditbot|linkedinbot|pinterest|embedly|quora link preview|w3c_validator|curl|wget|python-requests|python-urllib|axios|node-fetch|postman|headlesschrome|phantomjs|prerender/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return BOT_USER_AGENT_RE.test(userAgent);
}
