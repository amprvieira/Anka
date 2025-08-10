import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

function generateSuggestion(goalValue: number, currentValue: number, months: number) {
  const diff = goalValue - currentValue;
  if (diff <= 0) return 'Meta já atingida.';
  const monthly = Math.ceil(diff / months);
  return `Aumente contribuição em R$ ${monthly} por ${months} meses para atingir o objetivo.`;
}

const suggestionSchema = z.object({
  clientId: z.number().int(),
  goalId: z.number().int(),
});

export async function suggestionRoutes(app: FastifyInstance) {
  app.post('/suggestion', async (request, reply) => {
    const result = suggestionSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const {clientId, goalId} = result.data;
    const goal = await prisma.goal.findUnique({where: {id: goalId}});
    const client = await prisma.client.findUnique({where: {id: clientId}, include: {wallet: true}});
    if (!goal || !client || !client.wallet)
      return reply.status(404).send({error: 'Dados não encontrados'});
    const months = Math.max(
      1,
      Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
    );
    const suggestion = generateSuggestion(goal.targetValue, client.wallet.total, months);
    return {suggestion};
  });
}
