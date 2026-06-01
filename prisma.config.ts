import { defineConfig, env } from 'prisma/config';

let datasource: { url: string } | undefined;

try {
  datasource = { url: env('DATABASE_URL') };
} catch {
  // DATABASE_URL may not be set for commands like `generate`
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  ...(datasource ? { datasource } : {}),
});
