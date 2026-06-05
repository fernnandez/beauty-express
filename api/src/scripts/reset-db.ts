import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { resetDatabaseSchema } from './db-reset.util';

async function resetDb() {
  const dbConfig = getDatabaseConfig();

  console.log('🔄 Resetando schema do banco...\n');
  await resetDatabaseSchema(dbConfig);

  const dataSource = new DataSource({
    ...dbConfig,
    synchronize: true,
  });
  await dataSource.initialize();
  await dataSource.destroy();

  console.log('✅ Schema recriado com sucesso. Rode npm run seed para popular os dados.');
}

resetDb().catch((error) => {
  console.error('❌ Erro ao resetar banco:', error);
  process.exit(1);
});
