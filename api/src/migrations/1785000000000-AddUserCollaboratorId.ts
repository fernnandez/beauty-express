import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vincula a conta de login (users) a um registro de colaborador para permitir
 * que o colaborador faça login e veja apenas os próprios dados.
 */
export class AddUserCollaboratorId1785000000000 implements MigrationInterface {
  name = 'AddUserCollaboratorId1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "collaboratorId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_collaboratorId"
      FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_collaboratorId"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "collaboratorId"
    `);
  }
}
