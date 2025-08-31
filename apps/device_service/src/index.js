import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { db, migrate } from './db.js';
import { sql } from 'drizzle-orm';

const app = Fastify({ logger: true });
const dbUserId = '11111111-1111-1111-1111-111111111111'; // UUID для user_id в БД Работаем с одним юзером тк нет сервиса юзеров

app.get('/health', async () => ({ status: 'ok' }));

// Devices endpoints
app.get('/devices', async (request, reply) => {
  const result = await db.execute(sql`SELECT id, device_id as "deviceId", status FROM devices WHERE user_id = ${dbUserId}`);
  return result.rows ?? [];
});

app.post('/devices', async (request, reply) => {
  const body = request.body || {};
  const deviceModelId = body.deviceId;
  if (!deviceModelId) {
    reply.code(400);
    return { message: 'deviceId is required' };
  }
  const id = randomUUID();
  const status = 'ONLINE';
  await db.execute(sql`INSERT INTO devices (id, user_id, device_id, status) VALUES (${id}, ${dbUserId}, ${deviceModelId}, ${status})`);
  reply.code(201);
  return { id, deviceId: deviceModelId, status };
});

app.get('/devices/:id', async (request, reply) => {
  const { id } = request.params;
  const result = await db.execute(sql`SELECT id, device_id as "deviceId", status FROM devices WHERE id = ${id}`);
  if (!result.rows?.length) {
    reply.code(404);
    return { message: 'Device not found' };
  }
  return result.rows[0];
});

app.delete('/devices/:id', async (request, reply) => {
  const { id } = request.params;
  await db.execute(sql`DELETE FROM devices WHERE id = ${id} AND user_id = ${dbUserId}`);
  reply.code(204).send();
});

app.post('/devices/:id/command', async (request, reply) => {
  const { id } = request.params;
  const { command, params } = request.body || {};
  if (!command) {
    reply.code(400);
    return { message: 'command is required' };
  }
  reply.code(202);
  return { status: 'accepted', deviceId: id, command, params: params || {} };
});

// Telemetry query
app.get('/telemetry/:deviceId', async (request, reply) => {
  const { deviceId } = request.params;
  const { sensorId, from, to } = request.query || {};

  const where = [sql`device_id = ${deviceId}`];
  if (sensorId) where.push(sql`name = ${sensorId}`);
  if (from) where.push(sql`last_updated >= ${from}`);
  if (to) where.push(sql`last_updated <= ${to}`);

  const whereClause = where.length ? sql.join(where, sql` AND `) : sql`1=1`;
  const result = await db.execute(sql`
    SELECT id, device_id as "deviceId", name, type, location, value, unit, status,
           last_updated as "lastUpdated", created_at as "createdAt"
    FROM telemetry
    WHERE ${whereClause}
    ORDER BY last_updated DESC
  `);
  return result.rows ?? [];
});

app.get('/admin/device-models', async (request, reply) => {
  const result = await db.execute(sql`SELECT id, name, manufacturer, model, protocol, created_at as "createdAt" FROM device_models ORDER BY created_at DESC`);
  return result.rows ?? [];
});

app.post('/admin/device-models', async (request, reply) => {
  const body = request.body || {};
  const { id = randomUUID(), name, manufacturer, model, protocol } = body;
  if (!name || !manufacturer || !model || !protocol) {
    reply.code(400);
    return { message: 'name, manufacturer, model, protocol are required' };
  }
  await db.execute(sql`INSERT INTO device_models (id, name, manufacturer, model, protocol) VALUES (${id}, ${name}, ${manufacturer}, ${model}, ${protocol})`);
  reply.code(201);
  return { id, name, manufacturer, model, protocol };
});

const port = parseInt(process.env.PORT || '8083', 10);
const host = '0.0.0.0';

try {
  await migrate();
  await app.listen({ host, port });
  app.log.info(`device_service listening on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
