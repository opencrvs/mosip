import MOSIPAuthenticator from "./mosip-authenticator";
import { join } from "node:path";

const main = async () => {
  const authenticator = new MOSIPAuthenticator({
    // MOSIP Auth
    partnerApiKey: "447807",
    partnerMispLk: "9FChkkfixwsSFSvBaA7oCOkfNnBUj2XIZObAtyOGHsIAyG0JOG",
    partnerId: "opencrvs-auth-partner",

    // MOSIP Auth Server
    idaAuthDomainUri: "https://api-internal.collab.mosip.net",
    idaAuthUrl: "https://api.collab.mosip.net/idauthentication/v1/auth",

    // Crypto encrypt
    encryptCertPath: join(__dirname, "../../../../certs/ida-partner.crt"),
    decryptP12FilePath: join(__dirname, "../../../../certs/keystore.p12"),
    decryptP12FilePassword: "mosip123",

    // Crypto signature
    signP12FilePath: join(__dirname, "../../../../certs/keystore.p12"),
    signP12FilePassword: "mosip123",
  });

  const response = await authenticator.auth({
    individualId: "6580954839",
    individualIdType: "UIN",
    demographicData: {
      dob: "1992/04/29",
    },
    consent: true,
  });

  if (!response.ok) {
    throw new Error(`Error in MOSIP Authenticator: ${await response.text()}`);
  }

  console.log(await response.json());
};

main();
