import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

const simulationSchema = z.object({
  clientId: z.number().int(),
  data: z.any(),
});

export async function simulationRoutes(app: FastifyInstance) {
  app.get('/simulations', async () => {
    return await prisma.simulation.findMany();
  });

  app.post('/simulations', async (request, reply) => {
    const result = simulationSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const simulation = await prisma.simulation.create({data: result.data});
    return reply.status(201).send(simulation);
  });

  app.get('/simulations/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const simulation = await prisma.simulation.findUnique({where: {id: Number(id)}});
    if (!simulation) return reply.status(404).send({error: 'Simulation not found'});
    return simulation;
  });

  app.delete('/simulations/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    await prisma.simulation.delete({where: {id: Number(id)}});
    return reply.status(204).send();
  });
}
