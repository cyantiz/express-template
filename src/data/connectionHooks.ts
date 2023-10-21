export interface ConnectionHooks {
  onConnecting?: () => void;
  onConnected?: () => void;
  onOpen?: () => void;
  onDisconnecting?: () => void;
  onDisconnected?: () => void;
  onClose?: () => void;
  onReconnected?: () => void;
  onError?: (error: any) => void;
}
