import { RelayService, RelayStore } from "@aria/relay";

export const ariaRelayService = {
  id: "aria-relay",
  displayName: "Aria Relay",
  surface: "relay",
  sharedPackages: ["@aria/relay", "@aria/protocol"],
  planes: ["control", "data", "push"],
  capabilities: [
    "transport",
    "access-broker",
    "attachment-resume",
    "direct-or-relayed-routing",
    "server-scoped-access-grants",
  ],
} as const;

export interface AriaRelayServiceBootstrap {
  service: typeof ariaRelayService;
  store: RelayStore;
  relay: RelayService;
}

export function createAriaRelayServiceBootstrap(statePath: string): AriaRelayServiceBootstrap {
  const store = new RelayStore(statePath);
  return {
    service: ariaRelayService,
    store,
    relay: new RelayService(store),
  };
}
