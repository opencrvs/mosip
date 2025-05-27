import { FastifyReply, FastifyRequest } from "fastify";
import { getAllTransactions, getTransactionAndDiscard } from "../database";

interface AuthenticatedUser {
  scope: string[];
}

/**
 * Allow listing transactions for users that have the search scope.
 *
 * Rationale:
 * - Users with this scope would be able to see record UUID's and registration numbers in the UI anyway.
 */
const isAllowedToSearch = (scope: string[]) => {
  return scope.includes("search.birth") && scope.includes("search.death");
};

/**
 * Allow deleting transactions for users that have `record.reject-registration` scope.
 *
 * Rationale:
 * - This should be accompanied with a `rejectRegistration` call via Postman which requires this scope.
 */
const isAllowedToDelete = (scope: string[]) =>
  scope.includes("record.reject-registration");

export const getAllTransactionsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { scope } = request.user as AuthenticatedUser;

  if (!isAllowedToSearch(scope)) {
    console.log(scope);
    return reply.status(403).send({
      error: "You do not have permission to access this resource.",
    });
  }

  return getAllTransactions();
};

export type DeleteTransactionRequest = FastifyRequest<{
  Params: { id: string };
}>;

export const deleteTransactionHandler = async (
  request: DeleteTransactionRequest,
  reply: FastifyReply,
) => {
  const { scope } = request.user as AuthenticatedUser;

  if (!isAllowedToDelete(scope)) {
    return reply.status(403).send({
      error: "You do not have permission to access this resource.",
    });
  }

  const { id } = request.params;

  try {
    const transaction = getTransactionAndDiscard(id);

    reply.status(200).send(transaction);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    reply.status(404).send({ error: message });
  }
};
