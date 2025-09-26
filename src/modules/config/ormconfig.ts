// This ormconfig will be used by the typeorm CLI, e.g. for creating and generating migrations.
// The actual Nest application will not use this ormconfig.
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const connectionSource = new DataSource({
  migrationsTableName: 'migrations',
  type: 'postgres',
  schema: 'public',
  url: process.env.DATABASE_URL,
  logging: false,
  synchronize: false,
  name: 'default',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migration/*.ts'],
  subscribers: ['src/subscriber/*{.ts}'],
});

connectionSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
