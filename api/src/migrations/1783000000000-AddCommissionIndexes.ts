import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionIndexes1783000000000 implements MigrationInterface {
  name = 'AddCommissionIndexes1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_commissions_tenant_paid" ON "commissions" ("tenantId", "paid")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commissions_tenant_collaborator" ON "commissions" ("tenantId", "collaboratorId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_commissions_tenant_collaborator"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_commissions_tenant_paid"`);
  }
}
