import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set in .env');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: { url },
});
