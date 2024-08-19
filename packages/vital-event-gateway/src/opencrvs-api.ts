import { env } from "./constants";

/**
 * Fetches a JWT token from OpenCRVS to subscribe to vital events
 */
export async function fetchTokenForIntegration() {
  const response = await fetch(env.OPENCRVS_TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.OPENCRVS_CLIENT_ID,
      client_secret: env.OPENCRVS_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch token: ${response.statusText} from ${env.OPENCRVS_TOKEN_URL}. Error response: ${errorBody}`
    );
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Subscribes to birth and death events from OpenCRVS
 */
export async function subscribeToVitalEvents() {
  const token = await fetchTokenForIntegration();
  const topics = ["BIRTH_REGISTERED", "DEATH_REGISTERED"];

  for (const topic of topics) {
    const response = await fetch(env.OPENCRVS_WEBHOOK_SUBSCRIBE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        callback: env.OPENCRVS_WEBHOOK_CALLBACK_URL,
        mode: "subscribe",
        topic: topic,
        secret: env.OPENCRVS_SHA_SECRET,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to subscribe to ${topic}: ${response.statusText}. Error response: ${errorBody}`
      );
    }

    const body = await response.json();

    console.log(`Successfully subscribed to ${topic}. Response: ${body}`);
  }
}
