import { MigrationInterface, QueryRunner } from 'typeorm';

const PORTAL_MARIA_ID = 'b1000001-0001-4000-8000-000000000001';
const PORTAL_LOCAL_ID = 'b1000001-0001-4000-8000-000000000002';

export class AddPortalsAndTenantSettings1782000000000
  implements MigrationInterface
{
  name = 'AddPortalsAndTenantSettings1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      INSERT INTO "portals" ("id", "slug", "host", "loginBranding", "isActive")
      VALUES
        (
          '${PORTAL_MARIA_ID}',
          'mariaborboleta',
          'mariaborboleta.fernnandez.com',
          '{"displayName":"Maria Borboleta","logoUrl":null,"faviconUrl":null,"primaryColor":"#e64980","accentColor":"#faf5ff"}'::jsonb,
          true
        ),
        (
          '${PORTAL_LOCAL_ID}',
          'local-mariaborboleta',
          'localhost',
          '{"displayName":"Maria Borboleta","logoUrl":null,"faviconUrl":null,"primaryColor":"#e64980","accentColor":"#faf5ff"}'::jsonb,
          true
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "portalId" uuid,
      ADD COLUMN "settings" jsonb NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      UPDATE "tenants"
      SET
        "portalId" = '${PORTAL_MARIA_ID}',
        "settings" = jsonb_build_object(
          'branding', jsonb_build_object(
            'displayName', "name",
            'logoUrl', null,
            'faviconUrl', null,
            'primaryColor', '#e64980',
            'accentColor', '#faf5ff'
          ),
          'features', jsonb_build_object(
            'commissionsEnabled', true,
            'financialReportsMode', 'full'
          )
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ALTER COLUMN "portalId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD CONSTRAINT "FK_tenants_portalId"
      FOREIGN KEY ("portalId") REFERENCES "portals"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP CONSTRAINT "FK_tenants_portalId"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP COLUMN "settings"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP COLUMN "portalId"
    `);
    await queryRunner.query(`DROP TABLE "portals"`);
  }
}
