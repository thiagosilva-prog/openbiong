const GRAPH_API_VERSION = 'v21.0';

type MetaCapiEventInput = {
  pixelId: string;
  accessToken: string;
  eventName: string;
  eventId?: string;
  eventSourceUrl: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  customData?: Record<string, unknown>;
};

// Best-effort: a Meta outage or a bad token must never affect the click/view
// being recorded, so failures here are swallowed rather than thrown.
export async function sendMetaCapiEvent(
  input: MetaCapiEventInput
): Promise<void> {
  try {
    const userData: Record<string, unknown> = {};
    if (input.clientIp) {
      userData.client_ip_address = input.clientIp;
    }
    if (input.userAgent) {
      userData.client_user_agent = input.userAgent;
    }
    if (input.fbc) {
      userData.fbc = input.fbc;
    }
    if (input.fbp) {
      userData.fbp = input.fbp;
    }

    const body = {
      data: [
        {
          event_name: input.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          event_source_url: input.eventSourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: input.customData,
        },
      ],
    };

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${input.pixelId}/events?access_token=${encodeURIComponent(input.accessToken)}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // ignore — see comment above
  }
}

export function isWhatsAppUrl(href: string): boolean {
  try {
    const hostname = new URL(href).hostname;
    return hostname.includes('wa.me') || hostname.includes('whatsapp.com');
  } catch {
    return false;
  }
}

// ctx.req in the tRPC fetch adapter is a plain Fetch API Request, not a
// NextRequest, so it has no .cookies helper — read the raw header instead.
export function getCookie(
  cookieHeader: string | null,
  name: string
): string | undefined {
  if (!cookieHeader) {
    return;
  }
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      continue;
    }
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return;
}
