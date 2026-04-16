interface AriaDesktopRendererConfig {
  target: {
    serverId: string;
    baseUrl: string;
  };
}

interface Window {
  ariaDesktop?: AriaDesktopRendererConfig;
}

declare module "*.css";
