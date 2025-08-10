import {FastifyInstance, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {parse} from 'csv-parse/sync';

const prisma = new PrismaClient();

export async function csvImportRoutes(app: FastifyInstance) {
  app.post('/import/clients', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    let processed = 0;
    let total = 0;
    let buffer = '';

    request.raw.on('data', (chunk) => {
      buffer += chunk;
    });

    request.raw.on('end', async () => {
      try {
        const records = parse(buffer, {columns: true, trim: true}) as Array<{
          name: string;
          email: string;
          age: string;
          status: string;
          familyProfile: string;
        }>;
        total = records.length;
        for (const record of records) {
          await prisma.client.create({
            data: {
              name: record.name,
              email: record.email,
              age: Number(record.age),
              status: record.status === 'true',
              familyProfile: record.familyProfile,
            },
          });
          processed++;
          reply.raw.write(`event: progress\ndata: ${Math.round((processed / total) * 100)}\n\n`);
        }
        reply.raw.write(`event: done\ndata: import finished\n\n`);
        reply.raw.end();
      } catch (err: any) {
        reply.raw.write(`event: error\ndata: ${JSON.stringify(err.message)}\n\n`);
        reply.raw.end();
      }
    });
  });
}
