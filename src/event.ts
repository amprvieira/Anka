import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

const eventSchema = z.object({
  clientId: z.number().int(),
  type: z.string(),
  value: z.number(),
  frequency: z.enum(['única', 'mensal', 'anual']),
});

export async function eventRoutes(app: FastifyInstance) {
  app.get('/events', async () => {
    return await prisma.event.findMany();
  });

  app.post('/events', async (request, reply) => {
    const result = eventSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const event = await prisma.event.create({data: result.data});
    return reply.status(201).send(event);
  });

  app.get('/events/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const event = await prisma.event.findUnique({where: {id: Number(id)}});
    if (!event) return reply.status(404).send({error: 'Event not found'});
    return event;
  });

  app.put('/events/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const result = eventSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const event = await prisma.event.update({where: {id: Number(id)}, data: result.data});
    return event;
  });

  app.delete('/events/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    await prisma.event.delete({where: {id: Number(id)}});
    return reply.status(204).send();
  });
}
