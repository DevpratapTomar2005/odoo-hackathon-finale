import { envConfig } from './src/config/env.config.js';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: envConfig.DATABASE_URL,
  },
});
