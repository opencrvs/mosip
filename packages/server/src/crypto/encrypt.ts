import * as forge from 'node-forge';
import { env, VERSION_RSA_2048, KEY_SPLITTER, THUMBPRINT_LENGTH, AAD_SIZE, NONCE_SIZE, SYMMETRIC_KEY_SIZE, GCM_TAG_LENGTH, ASYMMETRIC_ALGORITHM, SYMMETRIC_ALGORITHM } from "../constants";

export function encryptAndSign(requestData: string) {
  const opencrvsPrivateKey: forge.pki.rsa.PrivateKey = forge.pki.privateKeyFromPem(
    env.OPENCRVS_PRIV_KEY
  )
  const mosipPublicKey: forge.pki.rsa.PublicKey = forge.pki.certificateFromPem(
    env.MOSIP_PUBLIC_KEY
  ).publicKey as forge.pki.rsa.PublicKey

  const symmetricKey: string = forge.random.getBytesSync(SYMMETRIC_KEY_SIZE)
  const nonce: string = forge.random.getBytesSync(NONCE_SIZE)
  const aad: string = forge.random.getBytesSync(AAD_SIZE - NONCE_SIZE)
  // putting random thumbprint temporarily
  const thumbprint: string = forge.random.getBytesSync(THUMBPRINT_LENGTH)

  const encryptedSymmetricKey: string = mosipPublicKey.encrypt(
    symmetricKey,
    ASYMMETRIC_ALGORITHM,
    {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    }
  )
  const encryptCipher = forge.cipher.createCipher(
    SYMMETRIC_ALGORITHM,
    symmetricKey
  )
  encryptCipher.start({
    iv: nonce,
    additionalData: nonce + aad,
    tagLength: GCM_TAG_LENGTH * 8
  })
  encryptCipher.update(forge.util.createBuffer(requestData))
  encryptCipher.finish()
  const encryptedData = Buffer.concat([
    Buffer.from(VERSION_RSA_2048),
    env.IS_THUMBRPINT ? Buffer.from(thumbprint, 'binary') : Buffer.alloc(0),
    Buffer.from(encryptedSymmetricKey, 'binary'),
    Buffer.from(KEY_SPLITTER),
    Buffer.from(
      nonce +
        aad +
        encryptCipher.output.getBytes() +
        encryptCipher.mode.tag.getBytes(),
      'binary'
    )
  ])

  const digestSign = forge.md.sha512.create()
  digestSign.update(encryptedData.toString('binary'))
  const sign = opencrvsPrivateKey.sign(digestSign)

  return {
    data: encryptedData.toString('base64'),
    signature: forge.util.encode64(sign)
  }
}
