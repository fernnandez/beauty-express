import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpensesTable1785500000000 implements MigrationInterface {
  name = 'AddExpensesTable1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "description" character varying NOT NULL, "category" character varying NOT NULL DEFAULT 'outros', "amount" numeric(10,2) NOT NULL, "type" character varying NOT NULL DEFAULT 'one_time', "date" date, "dayOfMonth" integer, "startDate" date, "endDate" date, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_expenses_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_expenses_tenant" ON "expenses" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_expenses_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_tenant"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
  }
}
