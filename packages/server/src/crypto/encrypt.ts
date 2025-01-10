import * as forge from 'node-forge';
import { env } from "../constants";

export function encryptAndSign(requestData: string) {
  const opencrvsPrivateKey: forge.pki.rsa.PrivateKey = forge.pki.privateKeyFromPem(
    env.OPENCRVS_PRIV_KEY
  )
  const mosipPublicKey: forge.pki.rsa.PublicKey = forge.pki.certificateFromPem(
    env.MOSIP_PUBLIC_KEY
  ).publicKey as forge.pki.rsa.PublicKey

  const symmetricKey: string = forge.random.getBytesSync(env.SYMMETRIC_KEY_SIZE)
  const nonce: string = forge.random.getBytesSync(env.NONCE_SIZE)
  const aad: string = forge.random.getBytesSync(env.AAD_SIZE - env.NONCE_SIZE)
  // putting random thumbprint temporarily
  const thumbprint: string = forge.random.getBytesSync(env.THUMBPRINT_LENGTH)

  const encryptedSymmetricKey: string = mosipPublicKey.encrypt(
    symmetricKey,
    env.ASYMMETRIC_ALGORITHM,
    {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    }
  )
  const encryptCipher = forge.cipher.createCipher(
    env.SYMMETRIC_ALGORITHM,
    symmetricKey
  )
  encryptCipher.start({
    iv: nonce,
    additionalData: nonce + aad,
    tagLength: env.GCM_TAG_LENGTH * 8
  })
  encryptCipher.update(forge.util.createBuffer(requestData))
  encryptCipher.finish()
  const encryptedData = Buffer.concat([
    Buffer.from(env.VERSION_RSA_2048),
    env.IS_THUMBRPINT ? Buffer.from(thumbprint, 'binary') : Buffer.alloc(0),
    Buffer.from(encryptedSymmetricKey, 'binary'),
    Buffer.from(env.KEY_SPLITTER),
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
