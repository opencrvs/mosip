import { env } from "./constants";
import { logger } from "./logger";


export async function generateMosipAid(): Promise<string> {
  const authToken: string = await getMosipAuthToken()
  if (!authToken) {
    logger.error(
      `failed getting mosip auth token. response: ${JSON.stringify(authToken)}`
    )
    return ''
  }
  const res = (await fetch(env.MOSIP_GENERATE_AID_URL, {
    method: 'GET',
    headers: {
      cookie: `Authorization=${authToken}`
    }
  })
    .then(response => {
      return response.json()
    })
    .catch(error => {
      throw new MOSIPError(
        `Failed receiving Aid. response: ${
          error.status
        }, response: ${error.text()}`
      );
    })) as string
  return res
}

export async function getMosipAuthToken(): Promise<string> {
  if (!env.MOSIP_AUTH_URL) {
    return 'Authorization'
  }
  const token = await fetch(env.MOSIP_AUTH_URL, {
    method: 'POST',
    body: `client_id=${env.MOSIP_AUTH_CLIENT_ID}&client_secret=${env.MOSIP_AUTH_CLIENT_SECRET}&username=${env.MOSIP_AUTH_USER}&password=${env.MOSIP_AUTH_PASS}&grant_type=password`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then(response => {
      return response.json()
    })
    .catch(error => {
      throw new MOSIPError(
        `Failed getting mosip auth token. response: ${
          error.status
        }, response: ${error.text()}`
      );
    })
  if (!token || !token['access_token']) {
    return ''
  } else {
    return token['access_token']
  }
}
export class MOSIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MOSIPError";
  }
}

export const postRecord = async (id:string, payload: string, url: string) => {
  let proxyRequest: string
  try {
    const encryptionResponse = encryptAndSign(payload)
    proxyRequest = JSON.stringify({
      id,
      requestTime: new Date().toISOString(),
      data: encryptionResponse.data,
      signature: encryptionResponse.signature
    })
  } catch (e) {
    logger.error(`Error encrypting and signing data: ${e}`)
    return
  }

  logger.info(`Encryting Payload Complete. Here is the payload id : ${id}`)

  const authToken = await getMosipAuthToken()
  if (!authToken) {
    throw new MOSIPError(
      `Failed getting mosip auth token. response: ${JSON.stringify(authToken)}`
    );
    return
  }

  logger.info(`ID - ${id}. Received MOSIP Auth token`)

  const res = await fetch(url, {
    method: 'POST',
    body: proxyRequest,
    headers: {
      'Content-Type': 'application/json',
      cookie: `Authorization=${authToken}`
    }
  })
    .then(response => {
      return response.text()
    })
    .catch(error => {
      logger.error(`failed sending data to mosip: ${error.message}`)
      return undefined
    })
  logger.info(`ID - ${id}. Sent data to Mosip. Response: ${res}`)
}
