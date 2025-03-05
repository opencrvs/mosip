// For MOSIP Connect, MOSIP doesn't send us the recordId's back in the token
// This is because the necessary changes to the Java mediator haven't been finished yet in https://github.com/mosip/mosip-opencrvs/issues/45

// See `routes/event-registration.ts` where the storage is set
// See `token.ts` where the storage is eventually used

import { UUID } from "./types/fhir";

type BRN = string;
type EventId = UUID;

export const storage: Record<BRN, EventId> = {};
