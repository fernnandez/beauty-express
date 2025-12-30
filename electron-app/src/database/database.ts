import { DataSource } from 'typeorm';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Collaborator } from '../entities/Collaborator';
import { Service } from '../entities/Service';
import { Appointment } from '../entities/Appointment';
import { Commission } from '../entities/Commission';
import { ScheduledService } from '../entities/ScheduledService';

let dataSource: DataSource | null = null;

// Verifica se o better-sqlite3 está disponível
function checkBetterSqlite3(): void {
  try {
    require('better-sqlite3');
    console.log('✅ better-sqlite3 encontrado');
  } catch (error: any) {
    console.error('❌ Erro ao carregar better-sqlite3:', error);
    console.error('Detalhes:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(
      `better-sqlite3 não está disponível. Isso geralmente acontece quando o módulo nativo não foi compilado corretamente para Windows.\n\n` +
      `Erro: ${error.message}\n\n` +
      `Solução: Reinstale as dependências e faça o build novamente.`
    );
  }
}

export async function initializeDatabase(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  // Verifica se better-sqlite3 está disponível antes de tentar usar
  checkBetterSqlite3();

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'beauty-express.db');

  console.log(`📁 Plataforma: ${process.platform}`);
  console.log(`📁 Caminho userData: ${userDataPath}`);
  console.log(`📁 Caminho do banco: ${dbPath}`);

  // Garante que o diretório existe
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`📁 Criando diretório: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar diretório do banco:', error);
    throw new Error(`Não foi possível criar o diretório do banco de dados: ${error.message}`);
  }

  dataSource = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Collaborator, Service, Appointment, Commission, ScheduledService],
    synchronize: true,
    logging: false,
  });

  try {
    console.log('🔄 Tentando inicializar banco de dados...');
    await dataSource.initialize();
    console.log('✅ Banco de dados inicializado com sucesso');
    return dataSource;
  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack,
    });
    
    // Mensagem de erro mais detalhada
    const errorMessage = error.message || 'Erro desconhecido';
    throw new Error(
      `Falha ao inicializar banco de dados:\n${errorMessage}\n\n` +
      `Caminho: ${dbPath}\n` +
      `Plataforma: ${process.platform}\n\n` +
      `Possíveis causas:\n` +
      `- Permissões insuficientes no diretório\n` +
      `- better-sqlite3 não compilado corretamente\n` +
      `- Antivírus bloqueando acesso ao arquivo`
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
    console.log('✅ Banco de dados fechado');
  }
}

export function getDataSource(): DataSource {
  if (!dataSource || !dataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dataSource;
}

