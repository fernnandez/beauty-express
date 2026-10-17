import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove o conceito de "portal". A aplicação passa a ser única (Ageendoo) e a
 * customização vive apenas no tenant (settings), após o login. Dropa a FK e a
 * coluna tenants.portalId e a tabela portals.
 *
 * ATENÇÃO: destrutiva. A tabela portals e a coluna portalId são removidas.
 */
export class RemovePortals1783000000000 implements MigrationInterface {
  name = 'RemovePortals1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "FK_tenants_portalId"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP COLUMN IF EXISTS "portalId"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "portals"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recria a estrutura mínima de portals para reversibilidade.
    await queryRunner.query(`
      CREATE TABLE "portals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying NOT NULL,
        "host" character varying NOT NULL,
        "loginBranding" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_portals_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_portals_host" UNIQUE ("host"),
        CONSTRAINT "PK_portals" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants" ADD COLUMN "portalId" uuid
    `);
  }
}
