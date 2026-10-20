import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto';

/**
 * Garante que o preço embutido nos serviços do agendamento respeita o mesmo
 * mínimo do CreateScheduledServiceDto (>= 0.01), evitando receita/comissão
 * zeradas ou negativas.
 */
describe('CreateAppointmentDto — validação de preço dos serviços', () => {
  const basePayload = {
    clientName: 'João Silva',
    clientPhone: '(11) 99999-9999',
    date: '2024-12-28',
    startTime: '09:00',
    endTime: '11:00',
    servicos: [{ serviceId: 'service-1' }],
  };

  async function validatePayload(overrideServico: Record<string, unknown>) {
    const dto = plainToInstance(CreateAppointmentDto, {
      ...basePayload,
      servicos: [{ serviceId: 'service-1', ...overrideServico }],
    });
    return validate(dto);
  }

  it('aceita preço ausente (usa o preço padrão do serviço)', async () => {
    const errors = await validatePayload({});
    expect(errors).toHaveLength(0);
  });

  it('aceita preço positivo', async () => {
    const errors = await validatePayload({ price: 100 });
    expect(errors).toHaveLength(0);
  });

  it('rejeita preço zero', async () => {
    const errors = await validatePayload({ price: 0 });
    expect(errors.length).toBeGreaterThan(0);
    const flat = JSON.stringify(errors);
    expect(flat).toContain('min');
  });

  it('rejeita preço negativo', async () => {
    const errors = await validatePayload({ price: -50 });
    expect(errors.length).toBeGreaterThan(0);
    const flat = JSON.stringify(errors);
    expect(flat).toContain('min');
  });
});
