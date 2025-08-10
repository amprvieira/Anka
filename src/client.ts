import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(0),
  status: z.boolean(),
  familyProfile: z.string().min(2),
});

export async function clientRoutes(app: FastifyInstance) {
  app.get('/clients', async () => {
    return await prisma.client.findMany();
  });

  app.post('/clients', async (request, reply) => {
    const result = clientSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const client = await prisma.client.create({data: result.data});
    return reply.status(201).send(client);
  });

  app.get('/clients/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const client = await prisma.client.findUnique({where: {id: Number(id)}});
    if (!client) return reply.status(404).send({error: 'Client not found'});
    return client;
  });

  app.put('/clients/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const result = clientSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const client = await prisma.client.update({where: {id: Number(id)}, data: result.data});
    return client;
  });

  app.delete('/clients/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    await prisma.client.delete({where: {id: Number(id)}});
    return reply.status(204).send();
  });
}
