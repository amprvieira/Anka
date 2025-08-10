import Fastify from 'fastify';
import {clientRoutes} from './client';
import {authRoutes, authenticate} from './auth';
import {goalRoutes} from './goal';
import {walletRoutes} from './wallet';
import {eventRoutes} from './event';
import {simulationRoutes} from './simulation';
import {projectionRoutes} from './projection';
import {suggestionRoutes} from './suggestion';
import {csvImportRoutes} from './csv-import';

const app = Fastify();

app.get('/', async () => {
  return {status: 'Backend rodando!'};
});

authRoutes(app);

// Protege rotas de dados
app.addHook('preHandler', authenticate);
clientRoutes(app);
goalRoutes(app);
walletRoutes(app);
eventRoutes(app);
simulationRoutes(app);
projectionRoutes(app);
suggestionRoutes(app);
csvImportRoutes(app);

app.listen({port: 3001}, (err: Error | null, address: string) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});
