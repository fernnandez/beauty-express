import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { UserRole } from '@domain/entities/user-role.enum';
import { User } from '@domain/entities/user.entity';

function printUsage(): void {
  console.log(`
Uso:
  npm run change-super-admin-password -- --email <email> --password <nova-senha>

  SUPER_ADMIN_EMAIL=... SUPER_ADMIN_PASSWORD=... npm run change-super-admin-password

Opções:
  --email, -e     E-mail do super admin (obrigatório se houver mais de um)
  --password, -p  Nova senha (mínimo 6 caracteres)
  --help, -h      Exibe esta ajuda

Exemplos:
  npm run change-super-admin-password -- -e owner@beautyexpress.com -p 'SenhaAdmin123!'
  DATABASE_URL=postgresql://... npm run change-super-admin-password -- -e owner@beautyexpress.com -p 'NovaSenha!'
`);
}

function parseArgs(argv: string[]): {
  email?: string;
  password?: string;
  help: boolean;
} {
  const result: { email?: string; password?: string; help: boolean } = {
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    if (arg === '--email' || arg === '-e') {
      result.email = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--password' || arg === '-p') {
      result.password = argv[i + 1];
      i += 1;
    }
  }

  return result;
}

async function changeSuperAdminPassword(): Promise<void> {
  const {
    email: emailArg,
    password: passwordArg,
    help,
  } = parseArgs(process.argv.slice(2));

  if (help) {
    printUsage();
    return;
  }

  const email = (emailArg ?? process.env.SUPER_ADMIN_EMAIL)
    ?.trim()
    .toLowerCase();
  const password = passwordArg ?? process.env.SUPER_ADMIN_PASSWORD;

  if (!password) {
    console.error(
      '❌ Informe a nova senha via --password ou SUPER_ADMIN_PASSWORD.\n',
    );
    printUsage();
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ A senha deve ter no mínimo 6 caracteres.');
    process.exit(1);
  }

  const dbConfig = getDatabaseConfig();
  const dataSource = new DataSource({
    ...dbConfig,
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);

    const superAdmins = await userRepository.find({
      where: { role: UserRole.SUPER_ADMIN, tenantId: null },
      order: { createdAt: 'ASC' },
    });

    if (superAdmins.length === 0) {
      console.error(
        '❌ Nenhum super admin encontrado (role=super_admin, tenantId=null).',
      );
      process.exit(1);
    }

    let user: User | undefined;

    if (email) {
      user = superAdmins.find(
        (candidate) => candidate.email.toLowerCase() === email,
      );
      if (!user) {
        console.error(`❌ Super admin não encontrado com e-mail: ${email}`);
        console.error(
          '   Super admins disponíveis:',
          superAdmins.map((candidate) => candidate.email).join(', '),
        );
        process.exit(1);
      }
    } else if (superAdmins.length === 1) {
      user = superAdmins[0];
    } else {
      console.error('❌ Há mais de um super admin. Informe --email.\n');
      superAdmins.forEach((candidate) => {
        console.error(`   - ${candidate.email}`);
      });
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await userRepository.update({ id: user.id }, { passwordHash });

    const revokeResult = await dataSource
      .createQueryBuilder()
      .delete()
      .from('refresh_tokens')
      .where('"userId" = :userId', { userId: user.id })
      .execute();

    console.log('✅ Senha do super admin atualizada com sucesso.');
    console.log(`   E-mail: ${user.email}`);
    console.log(`   ID:     ${user.id}`);
    console.log(
      `   Sessões revogadas: ${revokeResult.affected ?? 0} refresh token(s)`,
    );
  } finally {
    await dataSource.destroy();
  }
}

changeSuperAdminPassword().catch((error) => {
  console.error('❌ Erro ao alterar senha:', error);
  process.exit(1);
});
