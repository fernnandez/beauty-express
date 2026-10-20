import { InlineMediaStorage } from './inline-media-storage';

describe('InlineMediaStorage', () => {
  it('devolve a mídia como data URL base64', async () => {
    const storage = new InlineMediaStorage();
    const url = await storage.store({
      base64: 'QUJD',
      mime: 'image/png',
      tenantId: 't1',
      waMessageId: 'WA1',
    });
    expect(url).toBe('data:image/png;base64,QUJD');
  });
});
