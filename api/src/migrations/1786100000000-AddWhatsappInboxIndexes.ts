import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índices para os acessos quentes do inbox de WhatsApp:
 * - mensagens de uma conversa, ordenadas por horário (listByConversation)
 * - conversas de um tenant, ordenadas pela última mensagem (lista do inbox)
 */
export class AddWhatsappInboxIndexes1786100000000 implements MigrationInterface {
  name = 'AddWhatsappInboxIndexes1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_whatsapp_messages_tenant_conv_ts" ON "whatsapp_messages" ("tenantId", "conversationId", "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_whatsapp_conversations_tenant_lastmsg" ON "whatsapp_conversations" ("tenantId", "lastMessageAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_whatsapp_conversations_tenant_lastmsg"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_whatsapp_messages_tenant_conv_ts"`,
    );
  }
}
