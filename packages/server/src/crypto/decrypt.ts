import * as forge from 'node-forge';
import { env } from "../constants";

export async function decryptData(requestData: Buffer): Promise<string> {
  const keyDemiliterIndex: number = requestData.indexOf(env.KEY_SPLITTER)
  if (keyDemiliterIndex < 0) {
    throw new Error('Improper encrypted data format')
  }

  let encryptedSymmetricKey: Buffer
  let nonce: Buffer
  let aad: Buffer = Buffer.alloc(0)
  let encryptedData: Buffer
  let authTag: Buffer

  if (requestData.indexOf(env.VERSION_RSA_2048) === 0) {
    encryptedSymmetricKey = requestData.subarray(
      env.IS_THUMBRPINT
        ? env.VERSION_RSA_2048.length + env.THUMBPRINT_LENGTH
        : env.VERSION_RSA_2048.length,
      keyDemiliterIndex
    )
    nonce = requestData.subarray(
      keyDemiliterIndex + env.KEY_SPLITTER.length,
      keyDemiliterIndex + env.KEY_SPLITTER.length + env.NONCE_SIZE
    )
    aad = requestData.subarray(
      keyDemiliterIndex + env.KEY_SPLITTER.length,
      keyDemiliterIndex + env.KEY_SPLITTER.length + env.AAD_SIZE
    )
    encryptedData = requestData.subarray(
      keyDemiliterIndex + env.EY_SPLITTER.length + env.AAD_SIZE,
      requestData.length - env.GCM_TAG_LENGTH
    )
    authTag = requestData.subarray(
      requestData.length - env.GCM_TAG_LENGTH,
      requestData.length
    )
  } else if (env.IS_THUMBRPINT) {
    encryptedSymmetricKey = requestData.subarray(
      env.THUMBPRINT_LENGTH,
      keyDemiliterIndex
    )
    encryptedData = requestData.subarray(
      keyDemiliterIndex + env.KEY_SPLITTER.length + env.AAD_SIZE,
      requestData.length - env.GCM_TAG_LENGTH
    )
    authTag = requestData.subarray(
      requestData.length - env.GCM_TAG_LENGTH,
      requestData.length
    )
    nonce = encryptedData.subarray(
      encryptedData.length - env.GCM_TAG_LENGTH,
      encryptedData.length
    )
  } else {
    encryptedSymmetricKey = requestData.subarray(0, keyDemiliterIndex)
    encryptedData = requestData.subarray(
      keyDemiliterIndex + env.KEY_SPLITTER.length,
      requestData.length - env.GCM_TAG_LENGTH
    )
    authTag = requestData.subarray(
      requestData.length - env.GCM_TAG_LENGTH,
      requestData.length
    )
    nonce = encryptedData.subarray(
      encryptedData.length - env.GCM_TAG_LENGTH,
      encryptedData.length
    )
  }
  const opencrvsPrivKey: forge.pki.rsa.PrivateKey = forge.pki.privateKeyFromPem(
    env.OPENCRVS_PRIV_KEY
  )
  const decryptedSymmetricKey = opencrvsPrivKey.decrypt(
    encryptedSymmetricKey.toString('binary'),
    env.ASYMMETRIC_ALGORITHM,
    {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    }
  )
  const decipher = forge.cipher.createDecipher(
    SYMMETRIC_ALGORITHM,
    decryptedSymmetricKey
  )
  decipher.start({
    iv: nonce.toString('binary'),
    additionalData: aad.toString('binary'),
    tagLength: GCM_TAG_LENGTH * 8,
    tag: forge.util.createBuffer(authTag)
  })
  decipher.update(forge.util.createBuffer(encryptedData))
  const pass: boolean = decipher.finish()
  if (!pass) {
    throw new Error('Unable to decrypt data')
  }
  return Buffer.from(decipher.output.getBytes(), 'binary').toString('utf8')
}
