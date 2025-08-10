import {FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import jwt from 'jsonwebtoken';
import {z} from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

// Mock users
const users = [
  {id: 1, email: 'advisor@planner.com', password: 'advisorpw', role: 'advisor'},
  {id: 2, email: 'viewer@planner.com', password: 'viewerpw', role: 'viewer'},
];

export function authenticate(request: FastifyRequest, reply: FastifyReply, next: () => void) {
  const authHeader = request.headers['authorization'];
  if (!authHeader) return reply.status(401).send({error: 'Token missing'});
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (request as any).user = payload;
    next();
  } catch {
    return reply.status(401).send({error: 'Invalid token'});
  }
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error);
    }
    const {email, password} = result.data;
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return reply.status(401).send({error: 'Invalid credentials'});
    const token = jwt.sign({id: user.id, email: user.email, role: user.role}, JWT_SECRET, {
      expiresIn: '1d',
    });
    return {token, role: user.role};
  });
}
