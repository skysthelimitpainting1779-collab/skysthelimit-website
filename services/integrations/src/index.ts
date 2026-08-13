import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (context) =>
  context.json({
    service: 'integrations',
    status: 'ok',
  })
);

app.notFound((context) => context.json({ error: 'not_found' }, 404));

export default app;
