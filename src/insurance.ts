import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const insuranceSchema = z.object({
  clientId: z.number().int(),
  type: z.enum(['vida', 'invalidez']),
  value: z.number().positive()
});

export async function insuranceRoutes(app: FastifyInstance) {
  app.get('/insurances', async () => {
    return await prisma.insurance.findMany();
  });

  app.post('/insurances', async (request, reply) => {
    const result = insuranceSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const insurance = await prisma.insurance.create({ data: result.data });
    return reply.status(201).send(insurance);
  });

  app.get('/insurances/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const insurance = await prisma.insurance.findUnique({ where: { id: Number(id) } });
    if (!insurance) return reply.status(404).send({ error: 'Insurance not found' });
    return insurance;
  });

  app.put('/insurances/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = insuranceSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const insurance = await prisma.insurance.update({ where: { id: Number(id) }, data: result.data });
    return insurance;
  });

  app.delete('/insurances/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.insurance.delete({ where: { id: Number(id) } });
    return reply.status(204).send();
  });

  app.get('/insurances/distribution/:clientId', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const insurances = await prisma.insurance.findMany({ where: { clientId: Number(clientId) } });
    const total = insurances.reduce((sum, i) => sum + i.value, 0);
    const distribution = insurances.map(i => ({ type: i.type, percent: total ? Number(((i.value / total) * 100).toFixed(2)) : 0 }));
    return distribution;
  });
}
