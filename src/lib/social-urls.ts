const LEADING_AT_RE = /^@/;
const NON_DIGIT_RE = /\D/g;

export type SocialPlatformKey =
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'linkedin'
  | 'github'
  | 'discord'
  | 'twitch'
  | 'telegram'
  | 'threads';

// Builds a full profile URL from a bare @handle for a given platform.
// Shared between the server (initial-bento generation) and the client
// (the "add link" modal's quick-add presets) so the two never drift.
export function buildSocialUrl(
  platform: SocialPlatformKey,
  handleInput: string
): string {
  const handle = handleInput.trim().replace(LEADING_AT_RE, '');

  switch (platform) {
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'twitch':
      return `https://www.twitch.tv/${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle}`;
    case 'threads':
      return `https://threads.net/@${handle}`;
    default:
      return `https://${platform}.com/${handle}`;
  }
}

export function buildWhatsAppUrl(phoneInput: string, message?: string): string {
  const digits = phoneInput.replace(NON_DIGIT_RE, '');
  const query = message?.trim()
    ? `?text=${encodeURIComponent(message.trim())}`
    : '';
  return `https://wa.me/${digits}${query}`;
}
