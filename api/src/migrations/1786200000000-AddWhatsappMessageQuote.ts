import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Colunas para exibir mensagens que são resposta (reply/quote) de outra:
 * - quotedWaMessageId: id da mensagem citada no WhatsApp
 * - quotedPreview: prévia textual da mensagem citada (mostrada acima da resposta)
 */
export class AddWhatsappMessageQuote1786200000000
  implements MigrationInterface
{
  name = 'AddWhatsappMessageQuote1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "quotedWaMessageId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "quotedPreview" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP COLUMN IF EXISTS "quotedPreview"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP COLUMN IF EXISTS "quotedWaMessageId"`,
    );
  }
}
