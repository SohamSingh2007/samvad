import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';

export const DB_CONNECTION = 'DB_CONNECTION';

@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DbModule {}
