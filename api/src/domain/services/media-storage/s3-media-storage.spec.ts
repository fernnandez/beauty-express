const sendMock = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({
    __type: 'PutObject',
    input,
  })),
  PutBucketLifecycleConfigurationCommand: jest
    .fn()
    .mockImplementation((input) => ({
      __type: 'Lifecycle',
      input,
    })),
}));

import { S3MediaStorage } from './s3-media-storage';

describe('S3MediaStorage', () => {
  const ENV = { ...process.env };

  beforeEach(() => {
    sendMock.mockClear();
    process.env.S3_BUCKET = 'meu-bucket';
    process.env.S3_ACCESS_KEY_ID = 'ak';
    process.env.S3_SECRET_ACCESS_KEY = 'sk';
    process.env.S3_ENDPOINT = 'https://s3.railway.app';
    process.env.S3_PUBLIC_URL = 'https://cdn.exemplo.com';
    delete process.env.MEDIA_TTL_DAYS;
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('exige S3_BUCKET', () => {
    delete process.env.S3_BUCKET;
    expect(() => new S3MediaStorage()).toThrow(/S3_BUCKET/);
  });

  it('faz upload e retorna a URL pública com chave particionada por tenant/data', async () => {
    const storage = new S3MediaStorage();
    const url = await storage.store({
      base64: 'QUJD',
      mime: 'image/jpeg',
      tenantId: 'tenant-1',
      waMessageId: 'WA123',
    });

    // chave: whatsapp/<tenant>/<YYYY-MM-DD>/<msg>.jpg
    expect(url).toMatch(
      /^https:\/\/cdn\.exemplo\.com\/whatsapp\/tenant-1\/\d{4}-\d{2}-\d{2}\/WA123\.jpg$/,
    );
    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command.input.Bucket).toBe('meu-bucket');
    expect(command.input.ContentType).toBe('image/jpeg');
    expect(Buffer.isBuffer(command.input.Body)).toBe(true);
  });

  it('usa o endpoint quando não há S3_PUBLIC_URL', async () => {
    delete process.env.S3_PUBLIC_URL;
    const storage = new S3MediaStorage();
    const url = await storage.store({
      base64: 'QUJD',
      mime: 'image/webp',
      tenantId: 't2',
      waMessageId: 'WA9',
    });
    expect(url).toMatch(
      /^https:\/\/s3\.railway\.app\/meu-bucket\/whatsapp\/t2\/\d{4}-\d{2}-\d{2}\/WA9\.webp$/,
    );
  });

  it('aplica lifecycle/TTL no onModuleInit quando MEDIA_TTL_DAYS está setado', async () => {
    process.env.MEDIA_TTL_DAYS = '30';
    const storage = new S3MediaStorage();
    await storage.onModuleInit();
    const lifecycleCall = sendMock.mock.calls.find(
      (c) => c[0].__type === 'Lifecycle',
    );
    expect(lifecycleCall).toBeDefined();
    expect(
      lifecycleCall![0].input.LifecycleConfiguration.Rules[0].Expiration.Days,
    ).toBe(30);
  });

  it('não aplica lifecycle sem MEDIA_TTL_DAYS', async () => {
    const storage = new S3MediaStorage();
    await storage.onModuleInit();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
