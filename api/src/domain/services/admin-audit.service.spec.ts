import { AdminAuditLogRepository } from '@domain/repositories/admin-audit-log.repository';
import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  const repository = {
    save: jest.fn(),
    findRecent: jest.fn(),
  } as unknown as AdminAuditLogRepository;

  const service = new AdminAuditService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra ação de auditoria', async () => {
    await service.log(
      { actorUserId: 'user-1', ipAddress: '127.0.0.1' },
      'tenant.create',
      'tenant',
      'tenant-1',
      { slug: 'paulista' },
    );

    expect(repository.save).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      action: 'tenant.create',
      entityType: 'tenant',
      entityId: 'tenant-1',
      metadata: { slug: 'paulista' },
      ipAddress: '127.0.0.1',
    });
  });

  it('lista logs recentes', async () => {
    const logs = [{ id: 'log-1' }];
    (repository.findRecent as jest.Mock).mockResolvedValue(logs);

    await expect(service.listRecent(10)).resolves.toEqual(logs);
    expect(repository.findRecent).toHaveBeenCalledWith(10);
  });
});
