import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Remove o schema public e recria do zero.
 * Necessário quando o synchronize adiciona colunas NOT NULL em tabelas com dados antigos.
 */
export async function resetDatabaseSchema(
  config: DataSourceOptions,
): Promise<void> {
  const dataSource = new DataSource({
    ...config,
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    await dataSource.query('DROP SCHEMA public CASCADE;');
    await dataSource.query('CREATE SCHEMA public;');
    await dataSource.query('GRANT ALL ON SCHEMA public TO public;');
  } finally {
    await dataSource.destroy();
  }
}
