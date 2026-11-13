const PENDO_TRACK_URL = 'https://data.pendo.io/data/track';
const PENDO_TRACK_TIMEOUT_MS = 3000;

type PendoTrackProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type PendoTrackEvent = {
  event: string;
  visitorId: string | number;
  accountId?: string | number | null;
  properties?: PendoTrackProperties;
};

/**
 * Sends a server-side Track Event to Pendo.
 * Requires PENDO_TRACK_EVENT_SECRET (the Pendo track event integration key).
 * Tracking failures are logged and never thrown, so they can't break the
 * calling flow.
 */
export async function trackPendoEvent({
  event,
  visitorId,
  accountId,
  properties
}: PendoTrackEvent) {
  const integrationKey = process.env.PENDO_TRACK_EVENT_SECRET;
  if (!integrationKey) {
    return;
  }

  try {
    const response = await fetch(PENDO_TRACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pendo-integration-key': integrationKey
      },
      body: JSON.stringify({
        type: 'track',
        event,
        visitorId: String(visitorId),
        accountId:
          accountId === null || accountId === undefined
            ? 'system'
            : String(accountId),
        timestamp: Date.now(),
        properties: properties ?? {}
      }),
      signal: AbortSignal.timeout(PENDO_TRACK_TIMEOUT_MS)
    });

    if (!response.ok) {
      console.error(
        `Pendo track event "${event}" failed with status ${response.status}`
      );
    }
  } catch (error) {
    console.error(`Failed to send Pendo track event "${event}":`, error);
  }
}
