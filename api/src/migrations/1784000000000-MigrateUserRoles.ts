import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolida os papéis em super_admin | admin | collaborator.
 * - staff   -> collaborator (profissional com acesso restrito)
 * - manager -> admin        (gestor da filial)
 * role é varchar, então basta atualizar os valores.
 */
export class MigrateUserRoles1784000000000 implements MigrationInterface {
  name = 'MigrateUserRoles1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'collaborator' WHERE "role" = 'staff'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'admin' WHERE "role" = 'manager'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reversão best-effort: colaboradores voltam a 'staff'.
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'staff' WHERE "role" = 'collaborator'`,
    );
  }
}
