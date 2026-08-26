import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveCommissionToService1785000000000
  implements MigrationInterface
{
  name = 'MoveCommissionToService1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD COLUMN "commissionPercentage" numeric(5,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_services"
      DROP CONSTRAINT IF EXISTS "FK_ss_commissionRate"
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_services"
      DROP COLUMN IF EXISTS "commissionRateId"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "collaborator_commission_rates"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "collaborator_commission_rates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "collaboratorId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "percentage" numeric(5,2) NOT NULL,
        CONSTRAINT "PK_collaborator_commission_rates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborator_commission_rates"
      ADD CONSTRAINT "FK_ccr_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborator_commission_rates"
      ADD CONSTRAINT "FK_ccr_collaborator"
      FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_services"
      ADD COLUMN "commissionRateId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_services"
      ADD CONSTRAINT "FK_ss_commissionRate"
      FOREIGN KEY ("commissionRateId") REFERENCES "collaborator_commission_rates"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      DROP COLUMN "commissionPercentage"
    `);
  }
}
