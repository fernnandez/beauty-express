/**
 * Constantes de mensagens do sistema
 */
export const MESSAGES = {
  SUCCESS: {
    CREATE: {
      SERVICE: 'Serviço criado com sucesso!',
      COLLABORATOR: 'Colaborador criado com sucesso!',
      CLIENT: 'Cliente criado com sucesso!',
      APPOINTMENT: 'Agendamento criado com sucesso!',
      SCHEDULED_SERVICE: 'Serviço agendado com sucesso!',
    },
    UPDATE: {
      SERVICE: 'Serviço atualizado com sucesso!',
      COLLABORATOR: 'Colaborador atualizado com sucesso!',
      CLIENT: 'Cliente atualizado com sucesso!',
      APPOINTMENT: 'Agendamento atualizado com sucesso!',
      SCHEDULED_SERVICE: 'Serviço agendado atualizado com sucesso!',
    },
    DELETE: {
      SERVICE: 'Serviço excluído com sucesso!',
      COLLABORATOR: 'Colaborador excluído com sucesso!',
      CLIENT: 'Cliente excluído com sucesso!',
      APPOINTMENT: 'Agendamento cancelado com sucesso!',
    },
    COMPLETE: {
      APPOINTMENT: 'Agendamento concluído com sucesso!',
      SCHEDULED_SERVICE: 'Serviço concluído com sucesso!',
    },
    DEACTIVATE: {
      COLLABORATOR: 'Colaborador desativado com sucesso!',
    },
    MARK_PAID: 'Comissões marcadas como pagas com sucesso!',
    MARK_UNPAID: 'Comissões marcadas como não pagas com sucesso!',
  },
  ERROR: {
    CREATE: {
      SERVICE: 'Erro ao criar serviço',
      COLLABORATOR: 'Erro ao criar colaborador',
      CLIENT: 'Erro ao criar cliente',
      APPOINTMENT: 'Erro ao criar agendamento',
      SCHEDULED_SERVICE: 'Erro ao agendar serviço',
    },
    UPDATE: {
      SERVICE: 'Erro ao atualizar serviço',
      COLLABORATOR: 'Erro ao atualizar colaborador',
      CLIENT: 'Erro ao atualizar cliente',
      APPOINTMENT: 'Erro ao atualizar agendamento',
      SCHEDULED_SERVICE: 'Erro ao atualizar serviço agendado',
    },
    DELETE: {
      SERVICE: 'Erro ao excluir serviço',
      COLLABORATOR: 'Erro ao excluir colaborador',
      CLIENT: 'Erro ao excluir cliente',
      APPOINTMENT: 'Erro ao cancelar agendamento',
    },
    COMPLETE: {
      APPOINTMENT: 'Erro ao concluir agendamento',
      SCHEDULED_SERVICE: 'Erro ao concluir serviço',
    },
    DEACTIVATE: {
      COLLABORATOR: 'Erro ao desativar colaborador',
    },
    FETCH: {
      SERVICES: 'Erro ao carregar serviços',
      COLLABORATORS: 'Erro ao carregar colaboradores',
      CLIENTS: 'Erro ao carregar clientes',
      APPOINTMENTS: 'Erro ao carregar agendamentos',
      COMMISSIONS: 'Erro ao carregar comissões',
      SCHEDULED_SERVICES: 'Erro ao carregar serviços agendados',
    },
    GENERIC: 'Ocorreu um erro inesperado',
    NETWORK: 'Erro de conexão. Verifique sua internet.',
  },
} as const;
