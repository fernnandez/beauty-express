import { useState } from "react";
import {
  Avatar,
  Button,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { useClients, useCreateClient } from "../../hooks/useClients";
import { getErrorMessage } from "../../utils/error.util";
import { formatPhoneInput } from "../../utils/phone.util";
import type { Client } from "../../types";

interface ClientPickerModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  confirmLabel: string;
  loading?: boolean;
  /** Permite criar um novo cliente (aba extra). Default: false. */
  allowCreate?: boolean;
  /** Telefone sugerido ao criar (ex.: o número do contato do WhatsApp). */
  defaultPhone?: string;
  /** Nome sugerido ao criar (ex.: o nome do contato do WhatsApp). */
  defaultName?: string;
  onSelect: (client: Client) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ClientPickerModal({
  opened,
  onClose,
  title,
  confirmLabel,
  loading,
  allowCreate = false,
  defaultPhone,
  defaultName,
  onSelect,
}: ClientPickerModalProps) {
  const [tab, setTab] = useState<string | null>("existing");

  return (
    <Modal opened={opened} onClose={onClose} title={title} radius="lg" centered>
      {allowCreate ? (
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="existing" leftSection={<IconUsers size={16} />}>
              Cliente existente
            </Tabs.Tab>
            <Tabs.Tab value="new" leftSection={<IconUserPlus size={16} />}>
              Novo cliente
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="existing">
            <ExistingClientPanel
              confirmLabel={confirmLabel}
              loading={loading}
              onClose={onClose}
              onSelect={onSelect}
            />
          </Tabs.Panel>
          <Tabs.Panel value="new">
            <NewClientPanel
              defaultPhone={defaultPhone}
              defaultName={defaultName}
              linking={loading}
              onClose={onClose}
              onCreated={onSelect}
            />
          </Tabs.Panel>
        </Tabs>
      ) : (
        <ExistingClientPanel
          confirmLabel={confirmLabel}
          loading={loading}
          onClose={onClose}
          onSelect={onSelect}
        />
      )}
    </Modal>
  );
}

/* ----------------------------- Cliente existente -------------------------- */

function ExistingClientPanel({
  confirmLabel,
  loading,
  onClose,
  onSelect,
}: {
  confirmLabel: string;
  loading?: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 300);
  const [selected, setSelected] = useState<Client | null>(null);
  const { data: clients = [], isFetching } = useClients(debounced.trim());

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Buscar por nome ou telefone…"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        rightSection={isFetching ? <Loader size="xs" /> : undefined}
      />

      <ScrollArea.Autosize mah={320}>
        <Stack gap={4}>
          {clients.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="md">
              Nenhum cliente encontrado.
            </Text>
          )}
          {clients.map((client) => {
            const active = selected?.id === client.id;
            return (
              <UnstyledButton
                key={client.id}
                onClick={() => setSelected(client)}
                p="xs"
                style={{
                  borderRadius: 8,
                  backgroundColor: active
                    ? "var(--mantine-color-teal-0)"
                    : undefined,
                  border: active
                    ? "1px solid var(--mantine-color-teal-4)"
                    : "1px solid transparent",
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="xl" color="teal" variant="light" size="sm">
                    {initials(client.name)}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={500}>
                      {client.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {client.phone}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>

      <Group justify="flex-end" mt="sm">
        <Button variant="default" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          color="teal"
          disabled={!selected}
          loading={loading}
          onClick={() => selected && onSelect(selected)}
        >
          {confirmLabel}
        </Button>
      </Group>
    </Stack>
  );
}

/* ------------------------------- Novo cliente ----------------------------- */

function NewClientPanel({
  defaultPhone,
  defaultName,
  linking,
  onClose,
  onCreated,
}: {
  defaultPhone?: string;
  defaultName?: string;
  linking?: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const createClient = useCreateClient();
  const [name, setName] = useState(defaultName ?? "");
  const [phone, setPhone] = useState(
    defaultPhone ? formatPhoneInput(defaultPhone) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Informe o nome do cliente.");
      return;
    }
    createClient.mutate(
      { name: name.trim(), phone },
      {
        onSuccess: (client) => onCreated(client),
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Stack gap="sm">
      <TextInput
        label="Nome do cliente"
        placeholder="Nome completo"
        required
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <TextInput
        label="Telefone"
        placeholder="(11) 99999-9999"
        required
        value={phone}
        onChange={(e) => setPhone(formatPhoneInput(e.currentTarget.value))}
      />
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
      <Group justify="flex-end" mt="sm">
        <Button variant="default" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          color="teal"
          loading={createClient.isPending || linking}
          onClick={handleCreate}
        >
          Criar e vincular
        </Button>
      </Group>
    </Stack>
  );
}
