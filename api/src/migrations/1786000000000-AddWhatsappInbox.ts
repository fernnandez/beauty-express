import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsappInbox1786000000000 implements MigrationInterface {
  name = 'AddWhatsappInbox1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // whatsapp_instances
    await queryRunner.query(
      `CREATE TABLE "whatsapp_instances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "instanceName" character varying NOT NULL, "phoneNormalized" character varying, "status" character varying NOT NULL DEFAULT 'disconnected', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_whatsapp_instances_name" UNIQUE ("instanceName"), CONSTRAINT "PK_whatsapp_instances_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_instances" ADD CONSTRAINT "FK_whatsapp_instances_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // whatsapp_conversations
    await queryRunner.query(
      `CREATE TABLE "whatsapp_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "waChatId" character varying NOT NULL, "phoneNormalized" character varying NOT NULL, "contactName" character varying, "clientId" uuid, "status" character varying NOT NULL DEFAULT 'open', "lastMessagePreview" character varying, "lastMessageAt" TIMESTAMP WITH TIME ZONE, "unreadCount" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_whatsapp_conversations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_conversations_tenant_chat" ON "whatsapp_conversations" ("tenantId", "waChatId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "FK_whatsapp_conversations_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "FK_whatsapp_conversations_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // whatsapp_messages
    await queryRunner.query(
      `CREATE TABLE "whatsapp_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "conversationId" uuid NOT NULL, "waMessageId" character varying, "direction" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'text', "content" text, "mediaUrl" character varying, "status" character varying NOT NULL DEFAULT 'sent', "sentByUserId" uuid, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_whatsapp_messages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_whatsapp_messages_tenant_wamsg" ON "whatsapp_messages" ("tenantId", "waMessageId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_whatsapp_messages_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_whatsapp_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_whatsapp_messages_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_whatsapp_messages_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_whatsapp_messages_tenant_wamsg"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_messages"`);

    await queryRunner.query(
      `ALTER TABLE "whatsapp_conversations" DROP CONSTRAINT "FK_whatsapp_conversations_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_conversations" DROP CONSTRAINT "FK_whatsapp_conversations_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_whatsapp_conversations_tenant_chat"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_conversations"`);

    await queryRunner.query(
      `ALTER TABLE "whatsapp_instances" DROP CONSTRAINT "FK_whatsapp_instances_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_instances"`);
  }
}
