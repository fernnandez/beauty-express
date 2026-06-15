import {
  Autocomplete,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPhone, IconSearch, IconUserCircle } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useClients } from "../../hooks/useClients";
import type { Client } from "../../types";
import { formatPhoneInput } from "../../utils/phone.util";

export interface ClientFieldValues {
  clientId?: string;
  clientName: string;
  clientPhone: string;
}

interface ClientSelectorProps {
  values: ClientFieldValues;
  errors?: {
    clientName?: React.ReactNode;
    clientPhone?: React.ReactNode;
  };
  onChange: (values: ClientFieldValues) => void;
}

function getClientLabel(client: Client): string {
  return `${client.name} — ${client.phone}`;
}

export function ClientSelector({
  values,
  errors,
  onChange,
}: ClientSelectorProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const { data: clients = [], isFetching } = useClients(
    debouncedSearch.trim(),
    { enabled: debouncedSearch.trim().length >= 2 }
  );

  const options = useMemo(
    () => clients.map((client) => getClientLabel(client)),
    [clients]
  );

  const handleSelect = (label: string) => {
    const selected = clients.find((client) => getClientLabel(client) === label);
    if (!selected) {
      return;
    }

    onChange({
      clientId: selected.id,
      clientName: selected.name,
      clientPhone: selected.phone,
    });
    setSearch("");
  };

  const handleNameChange = (name: string) => {
    onChange({
      ...values,
      clientId: undefined,
      clientName: name,
    });
  };

  const handlePhoneChange = (phone: string) => {
    onChange({
      ...values,
      clientId: undefined,
      clientPhone: formatPhoneInput(phone),
    });
  };

  return (
    <Stack gap="sm">
      <Autocomplete
        label="Buscar cliente cadastrado"
        placeholder="Digite nome ou telefone..."
        leftSection={<IconSearch size={16} />}
        data={options}
        value={search}
        onChange={setSearch}
        onOptionSubmit={handleSelect}
        rightSection={
          isFetching ? (
            <Text size="xs" c="dimmed" pr="xs">
              ...
            </Text>
          ) : undefined
        }
      />

      <Text size="xs" c="dimmed">
        Ou preencha os dados abaixo para cadastrar na hora
      </Text>

      <Group grow align="flex-start">
        <TextInput
          label="Nome do Cliente"
          placeholder="Nome completo"
          required
          leftSection={<IconUserCircle size={16} />}
          value={values.clientName}
          onChange={(event) => handleNameChange(event.currentTarget.value)}
          error={errors?.clientName}
        />
        <TextInput
          label="Telefone do Cliente"
          placeholder="(11) 99999-9999"
          required
          leftSection={<IconPhone size={16} />}
          value={values.clientPhone}
          onChange={(event) => handlePhoneChange(event.currentTarget.value)}
          error={errors?.clientPhone}
        />
      </Group>
    </Stack>
  );
}
