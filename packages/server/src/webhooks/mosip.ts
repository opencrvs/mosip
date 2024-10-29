import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { confirmRegistration } from "../opencrvs-api";

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

  await confirmRegistration(
    eventId,
    {
      trackingId,
      registrationNumber: "BRN12341234", // @TODO
      childIdentifiers: [{ type: "NID", value: nid }],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  reply.code(200);
};
