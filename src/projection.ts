import {FastifyInstance} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';

const prisma = new PrismaClient();

// Função principal de projeção patrimonial
export function simulateWealthCurve(
  initialState: number,
  events: Array<{value: number; frequency: string}>,
  rate: number
) {
  const results: Array<{year: number; projectedValue: number}> = [];
  let value = initialState;
  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  for (let year = new Date().getFullYear(); year <= 2060; year++) {
    for (let month = 0; month < 12; month++) {
      // Aplica eventos recorrentes
      events.forEach((event) => {
        if (event.frequency === 'mensal') value += event.value;
        if (event.frequency === 'anual' && month === 0) value += event.value;
        if (event.frequency === 'única' && year === new Date().getFullYear() && month === 0)
          value += event.value;
      });
      value *= 1 + monthlyRate;
    }
    results.push({year, projectedValue: Number(value.toFixed(2))});
  }
  return results;
}

const projectionSchema = z.object({
  clientId: z.number().int(),
  rate: z.number().positive().default(0.04),
});

export async function projectionRoutes(app: FastifyInstance) {
  app.post('/projection', async (request, reply) => {
    const result = projectionSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const {clientId, rate} = result.data;
    const client = await prisma.client.findUnique({
      where: {id: clientId},
      include: {events: true, wallet: true},
    });
    if (!client || !client.wallet)
      return reply.status(404).send({error: 'Client or wallet not found'});
    const events = client.events.map((e) => ({value: e.value, frequency: e.frequency}));
    const initialState = client.wallet.total;
    const curve = simulateWealthCurve(initialState, events, rate);
    return curve;
  });
}
