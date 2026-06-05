import 'dotenv/config';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './database.config';

const isCompiled = __filename.endsWith('.js');

export default new DataSource({
  ...getDatabaseConfig(),
  synchronize: false,
  migrations: [
    isCompiled
      ? __dirname + '/../migrations/*.js'
      : __dirname + '/../migrations/*.{ts,js}',
  ],
});
