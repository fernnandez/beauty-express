import { DateTime } from "luxon";
import type { ScheduledServiceInputDto, Service } from "../types";

// Gera opções de horário de 8h às 20h em intervalos de 30 minutos
export const generateTimeOptions = () => {
  const options = [];
  for (let hour = 8; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      options.push({ value: timeString, label: timeString });
    }
  }
  return options;
};

export const TIME_OPTIONS = generateTimeOptions();

// Valida formato de horário (HH:MM)
export const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Valida que horário de início é anterior ao horário de término
export const validateTimeRange = (
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } => {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return {
      valid: false,
      error: "Formato de horário inválido. Use HH:MM",
    };
  }

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    return {
      valid: false,
      error: "Horário de início deve ser anterior ao horário de término",
    };
  }

  return { valid: true };
};

// Formata data para yyyy-MM-dd usando Luxon
// Aceita Date ou string (do DatePickerInput do Mantine)
// Usa os componentes da data (ano, mês, dia) para evitar problemas de fuso horário
export const formatDateToString = (date: Date | string | null): string | undefined => {
  if (!date) return undefined;
  
  let luxonDate: DateTime;
  
  if (typeof date === "string") {
    // Se for string, tenta parsear com Luxon
    // Pode vir no formato DD/MM/YYYY do DatePickerInput ou ISO
    luxonDate = DateTime.fromFormat(date, "dd/MM/yyyy", { zone: 'local' });
    if (!luxonDate.isValid) {
      // Tenta como ISO se não funcionar
      luxonDate = DateTime.fromISO(date, { zone: 'local' });
    }
    if (!luxonDate.isValid) {
      // Se ainda não funcionar, tenta criar a partir de new Date
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      luxonDate = DateTime.fromObject({ year, month, day }, { zone: 'local' });
    }
  } else if (date instanceof Date) {
    // Se for Date, extrai os componentes da data local para evitar problemas de fuso horário
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() retorna 0-11
    const day = date.getDate();
    luxonDate = DateTime.fromObject({ year, month, day }, { zone: 'local' });
  } else {
    return undefined;
  }
  
  return luxonDate.toFormat("yyyy-MM-dd");
};

// Converte serviços do formulário para formato da API
export const convertServicesToDto = (
  services: Array<{
    serviceId: string;
    collaboratorId?: string;
    price?: number;
  }>,
  servicesList: Service[] | undefined
): ScheduledServiceInputDto[] => {
  return services.map((servico) => {
    const service = servicesList?.find((s) => s.id === servico.serviceId);
    if (!service) {
      throw new Error(`Serviço não encontrado: ${servico.serviceId}`);
    }

    // Garante que sempre tenha um preço válido (número)
    const price =
      typeof servico.price === "number" && servico.price > 0
        ? servico.price
        : service.defaultPrice;

    const result: ScheduledServiceInputDto = {
      serviceId: servico.serviceId,
      price,
    };

    // Só adiciona collaboratorId se estiver definido
    if (servico.collaboratorId) {
      result.collaboratorId = servico.collaboratorId;
    }

    return result;
  });
};

// Calcula preço total dos serviços
export const calculateTotalPrice = (
  services: Array<{
    serviceId: string;
    price?: number;
  }>,
  servicesList: Service[] | undefined
): number => {
  return services.reduce((total, servico) => {
    if (servico.price) {
      return total + servico.price;
    }
    const service = servicesList?.find((s) => s.id === servico.serviceId);
    return total + (service?.defaultPrice || 0);
  }, 0);
};

// Formata preço para exibição
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

// Formata uma data para exibição em pt-BR
export const formatDate = (date: Date | string): string => {
  let luxonDate: DateTime;
  if (typeof date === "string") {
    // Tenta parsear como ISO primeiro, depois como objeto
    luxonDate = DateTime.fromISO(date, { zone: 'local' });
    if (!luxonDate.isValid) {
      // Se não for ISO válido, tenta criar a partir de componentes
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      luxonDate = DateTime.fromObject({ year, month, day }, { zone: 'local' });
    }
  } else {
    // Extrai componentes da data local para evitar problemas de fuso horário
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    luxonDate = DateTime.fromObject({ year, month, day }, { zone: 'local' });
  }
  return luxonDate.setLocale('pt-BR').toLocaleString(DateTime.DATE_SHORT);
};

// Formata uma data e hora para exibição em pt-BR
export const formatDateTime = (date: Date | string): string => {
  let luxonDate: DateTime;
  if (typeof date === "string") {
    // Tenta parsear como ISO primeiro
    luxonDate = DateTime.fromISO(date, { zone: 'local' });
    if (!luxonDate.isValid) {
      // Se não for ISO válido, usa new Date e converte
      luxonDate = DateTime.fromJSDate(new Date(date), { zone: 'local' });
    }
  } else {
    // Converte Date para DateTime mantendo o fuso local
    luxonDate = DateTime.fromJSDate(date, { zone: 'local' });
  }
  return luxonDate.setLocale('pt-BR').toLocaleString(DateTime.DATETIME_SHORT);
};

// Formata data e horário do agendamento (data + startTime - endTime)
export const formatAppointmentDateTime = (
  date: Date | string,
  startTime?: string,
  endTime?: string
): string => {
  const formattedDate = formatDate(date);
  if (startTime && endTime) {
    return `${formattedDate} ${startTime} - ${endTime}`;
  }
  return formattedDate;
};

// Formata serviço para exibição no Select
export const formatServiceOption = (service: Service) => ({
  value: service.id,
  label: `${service.name} - ${formatPrice(service.defaultPrice)}`,
});
