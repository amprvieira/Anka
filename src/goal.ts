import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

const goalSchema = z.object({
  clientId: z.number().int(),
  type: z.string(),
  targetValue: z.number().positive(),
  targetDate: z.string().datetime(),
});

export async function goalRoutes(app: FastifyInstance) {
  app.get('/goals', async () => {
    return await prisma.goal.findMany();
  });

  app.post('/goals', async (request, reply) => {
    const result = goalSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const goal = await prisma.goal.create({
      data: {...result.data, targetDate: new Date(result.data.targetDate)},
    });
    return reply.status(201).send(goal);
  });

  app.get('/goals/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const goal = await prisma.goal.findUnique({where: {id: Number(id)}});
    if (!goal) return reply.status(404).send({error: 'Goal not found'});
    return goal;
  });

  app.put('/goals/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const result = goalSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const goal = await prisma.goal.update({
      where: {id: Number(id)},
      data: {...result.data, targetDate: new Date(result.data.targetDate)},
    });
    return goal;
  });

  app.delete('/goals/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    await prisma.goal.delete({where: {id: Number(id)}});
    return reply.status(204).send();
  });
}
