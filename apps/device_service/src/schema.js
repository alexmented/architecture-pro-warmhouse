import { sql } from 'drizzle-orm';

export const ddl = {
  enableUuidExt: sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  deviceModels: sql`
    CREATE TABLE IF NOT EXISTS device_models (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      protocol TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  devices: sql`
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      device_id UUID NOT NULL REFERENCES device_models(id) ON DELETE RESTRICT,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  telemetry: sql`
    CREATE TABLE IF NOT EXISTS telemetry (
      id UUID PRIMARY KEY,
      device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      location VARCHAR(100) NOT NULL,
      value DOUBLE PRECISION,
      unit VARCHAR(20),
      status VARCHAR(20),
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
};
