import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientsTable1781000000000 implements MigrationInterface {
  name = 'AddClientsTable1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "phone" character varying NOT NULL, "phoneNormalized" character varying NOT NULL, CONSTRAINT "PK_clients_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_clients_tenant_phone" ON "clients" ("tenantId", "phoneNormalized")`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "clientId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "clientId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_tenant"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_clients_tenant_phone"`);
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}
