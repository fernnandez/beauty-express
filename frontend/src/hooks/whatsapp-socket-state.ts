import { useSyncExternalStore } from "react";

/**
 * Store mínimo para compartilhar o estado de conexão do socket do WhatsApp
 * entre o hook do socket e os hooks de query. Permite tratar o polling como
 * *fallback*: quando o socket está vivo, pollamos pouco (safety net); quando
 * cai, voltamos a pollar com frequência.
 */
let connected = false;
const listeners = new Set<() => void>();

export function setWhatsappSocketConnected(value: boolean): void {
  if (connected === value) return;
  connected = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return connected;
}

/** Reage ao estado de conexão do socket do WhatsApp. */
export function useWhatsappSocketConnected(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
