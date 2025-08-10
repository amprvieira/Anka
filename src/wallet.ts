import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

const walletSchema = z.object({
  clientId: z.number().int(),
  total: z.number().positive(),
  classes: z.record(z.string(), z.number().min(0).max(100)),
});

export async function walletRoutes(app: FastifyInstance) {
  app.get('/wallets', async () => {
    return await prisma.wallet.findMany();
  });

  app.post('/wallets', async (request, reply) => {
    const result = walletSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const wallet = await prisma.wallet.create({data: result.data});
    return reply.status(201).send(wallet);
  });

  app.get('/wallets/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const wallet = await prisma.wallet.findUnique({where: {id: Number(id)}});
    if (!wallet) return reply.status(404).send({error: 'Wallet not found'});
    return wallet;
  });

  app.put('/wallets/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    const result = walletSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const wallet = await prisma.wallet.update({where: {id: Number(id)}, data: result.data});
    return wallet;
  });

  app.delete('/wallets/:id', async (request, reply) => {
    const {id} = request.params as {id: string};
    await prisma.wallet.delete({where: {id: Number(id)}});
    return reply.status(204).send();
  });
}
