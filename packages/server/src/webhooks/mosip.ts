import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as opencrvs from "../opencrvs-api";
import { generateRegistrationNumber } from "../registration-number";

export const mosipNidSchema = z.object({
  eventId: z
    .string()
    .describe("The identifier for the event (record) from OpenCRVS"),
  trackingId: z
    .string()
    .describe("The tracking ID for the event (record) from OpenCRVS"),
  nid: z.string().describe("The identifier for the registration from MOSIP"),
  token: z
    .string()
    .describe(
      "The one-time token from OpenCRVS. MOSIP should pass this through without using it."
    ),
});

type MosipRequest = FastifyRequest<{
  Body: z.infer<typeof mosipNidSchema>;
}>;

/** Handles the calls coming from MOSIP */
export const mosipHandler = async (
  request: MosipRequest,
  reply: FastifyReply
) => {
  const { eventId, trackingId, nid, token } = request.body;
  const registrationNumber = generateRegistrationNumber(trackingId);

  await opencrvs.confirmRegistration(
    {
      id: eventId,
      registrationNumber,
      identifiers: [{ type: "BIRTH_CONFIGURABLE_IDENTIFIER_1", value: nid }],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  reply.code(200);
};

export const OIDPUserInfoSchema = z.object({
  code: z.string(),
  clientId: z.string(),
  redirectUri: z.string(),
  grantType: z.string(),
});

type OIDPUserInfoRequest = FastifyRequest<{
  Body: z.infer<typeof OIDPUserInfoSchema>;
}>;

export const getOIDPUserInfo = async (
  request: OIDPUserInfoRequest,
  reply: FastifyReply
) => {
  const { token } = request.headers;
  const { code, clientId, redirectUri, grantType } = request.body;

  await opencrvs.getOIDPUserInfo(
    {
      code,
      clientId,
      redirectUri,
      grantType,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  reply.code(200);
};
