import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780683492812 implements MigrationInterface {
  name = 'InitialSchema1780683492812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "defaultPrice" numeric(10,2) NOT NULL, "description" text, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "phone" character varying NOT NULL, "area" character varying NOT NULL, "commissionPercentage" numeric(5,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f579a5df9d66287f400806ad875" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "scheduled_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "appointmentId" uuid NOT NULL, "serviceId" uuid NOT NULL, "collaboratorId" uuid, "price" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'pendente', CONSTRAINT "PK_82658fcab6d3363dc81ff7bb6d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "clientName" character varying NOT NULL, "clientPhone" character varying NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "startTime" character varying NOT NULL, "endTime" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'agendado', "observations" text, CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "collaboratorId" uuid NOT NULL, "scheduledServiceId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "percentage" numeric(5,2) NOT NULL, "paid" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_ddea36e931c3d742e35bb1a205b" UNIQUE ("scheduledServiceId"), CONSTRAINT "PK_2701379966e2e670bb5ff0ae78e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" character varying NOT NULL, "tenantId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7346b08032078107fce81e014f6" UNIQUE ("email", "tenantId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorUserId" uuid NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" uuid, "metadata" jsonb, "ipAddress" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_de7a8fc2fbb525484c71a86bb96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "audience" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaborator_services" ("collaboratorId" uuid NOT NULL, "serviceId" uuid NOT NULL, CONSTRAINT "PK_8a66656dc52f4df153e1021019b" PRIMARY KEY ("collaboratorId", "serviceId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f15c647fa13d3f372830956cbf" ON "collaborator_services" ("collaboratorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a03327ccfa725c1d68bea5814" ON "collaborator_services" ("serviceId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_c61e3da9e437d4534faa63cf94a" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD CONSTRAINT "FK_869d3a6bacb7afb9b1cb1fcd835" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" ADD CONSTRAINT "FK_97e55ad71f8d40fb50fe450f683" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" ADD CONSTRAINT "FK_dab4b12d0209c208445eafd75a4" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" ADD CONSTRAINT "FK_124c23a972cfcd935730e1d1427" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" ADD CONSTRAINT "FK_4464d8263dc99282381fe26b7c6" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_46e6a4182e96de9d4c1bba50604" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" ADD CONSTRAINT "FK_2cee0740e4e801ad71c071b5174" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" ADD CONSTRAINT "FK_1434e0504dd6f073a6f35bae0eb" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" ADD CONSTRAINT "FK_ddea36e931c3d742e35bb1a205b" FOREIGN KEY ("scheduledServiceId") REFERENCES "scheduled_services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborator_services" ADD CONSTRAINT "FK_f15c647fa13d3f372830956cbfa" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborator_services" ADD CONSTRAINT "FK_2a03327ccfa725c1d68bea58145" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaborator_services" DROP CONSTRAINT "FK_2a03327ccfa725c1d68bea58145"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborator_services" DROP CONSTRAINT "FK_f15c647fa13d3f372830956cbfa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" DROP CONSTRAINT "FK_ddea36e931c3d742e35bb1a205b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" DROP CONSTRAINT "FK_1434e0504dd6f073a6f35bae0eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" DROP CONSTRAINT "FK_2cee0740e4e801ad71c071b5174"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_46e6a4182e96de9d4c1bba50604"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" DROP CONSTRAINT "FK_4464d8263dc99282381fe26b7c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" DROP CONSTRAINT "FK_124c23a972cfcd935730e1d1427"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" DROP CONSTRAINT "FK_dab4b12d0209c208445eafd75a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_services" DROP CONSTRAINT "FK_97e55ad71f8d40fb50fe450f683"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP CONSTRAINT "FK_869d3a6bacb7afb9b1cb1fcd835"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_c61e3da9e437d4534faa63cf94a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a03327ccfa725c1d68bea5814"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f15c647fa13d3f372830956cbf"`,
    );
    await queryRunner.query(`DROP TABLE "collaborator_services"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "commissions"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "scheduled_services"`);
    await queryRunner.query(`DROP TABLE "collaborators"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
