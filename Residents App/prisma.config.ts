import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

// Neon pooled connections (pgbouncer) do not support DDL commands
// needed by migrations. Use the direct/unpooled URL for Prisma CLI,
// falling back to DATABASE_URL for local development.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: { url },
});
