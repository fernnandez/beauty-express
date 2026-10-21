import { AdminAuditLogRepository } from '@domain/repositories/admin-audit-log.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  const repository = {
    save: jest.fn(),
    findRecent: jest.fn(),
  } as unknown as AdminAuditLogRepository;

  const userRepository = {
    find: jest.fn().mockResolvedValue([]),
  } as unknown as UserRepository;

  const service = new AdminAuditService(repository, userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    (userRepository.find as jest.Mock).mockResolvedValue([]);
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

  it('lista logs recentes com e-mail do ator', async () => {
    const logs = [{ id: 'log-1', actorUserId: 'user-1' }];
    (repository.findRecent as jest.Mock).mockResolvedValue(logs);
    (userRepository.find as jest.Mock).mockResolvedValue([
      { id: 'user-1', email: 'owner@x.com' },
    ]);

    const result = await service.listRecent(10);

    expect(repository.findRecent).toHaveBeenCalledWith(10);
    expect(result).toEqual([
      { id: 'log-1', actorUserId: 'user-1', actorEmail: 'owner@x.com' },
    ]);
  });
});
