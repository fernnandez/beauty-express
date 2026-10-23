import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollaboratorCommissionRates1784000000000 implements MigrationInterface {
  name = 'AddCollaboratorCommissionRates1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      CREATE INDEX "IDX_ccr_tenant_collaborator"
      ON "collaborator_commission_rates" ("tenantId", "collaboratorId")
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
      INSERT INTO "collaborator_commission_rates" ("tenantId", "collaboratorId", "name", "percentage")
      SELECT "tenantId", "id", "area", "commissionPercentage"
      FROM "collaborators"
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
      UPDATE "scheduled_services" ss
      SET "commissionRateId" = ccr.id
      FROM "collaborator_commission_rates" ccr
      WHERE ss."collaboratorId" = ccr."collaboratorId"
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborators"
      DROP COLUMN "commissionPercentage"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborators"
      ADD COLUMN "commissionPercentage" numeric(5,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "collaborators" c
      SET "commissionPercentage" = COALESCE((
        SELECT ccr."percentage"
        FROM "collaborator_commission_rates" ccr
        WHERE ccr."collaboratorId" = c.id
        ORDER BY ccr."percentage" DESC
        LIMIT 1
      ), 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborators"
      ALTER COLUMN "commissionPercentage" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_services"
      DROP CONSTRAINT "FK_ss_commissionRate"
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_services"
      DROP COLUMN "commissionRateId"
    `);

    await queryRunner.query(`
      DROP TABLE "collaborator_commission_rates"
    `);
  }
}
