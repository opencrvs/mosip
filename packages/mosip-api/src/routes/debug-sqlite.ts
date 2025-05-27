import { FastifyReply, FastifyRequest } from "fastify";
import { getAllTransactions, getTransactionAndDiscard } from "../database";

export const getAllTransactionsHandler = async () => {
  return getAllTransactions();
};

export type DeleteTransactionRequest = FastifyRequest<{
  Params: { id: string };
}>;

export const deleteTransactionHandler = async (
  request: DeleteTransactionRequest,
  reply: FastifyReply,
) => {
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
