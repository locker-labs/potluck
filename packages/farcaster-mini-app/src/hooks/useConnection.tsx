import { chainId } from '@/config';
import { useCallback, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import sdk from '@farcaster/frame-sdk';

export function useConnection() {
  const [error, setError] = useState<string | null>(null);

  const { isConnected, address, chainId: currentChainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Get the preferred connector based on availability
  const getPreferredConnector = useCallback(async () => {
    const isFarcaster = await sdk.context;

    const connectorPreferences = [
      { id: 'farcaster', condition: isFarcaster },
      { id: 'io.metamask', condition: true },
    ];

    for (const pref of connectorPreferences) {
      const connector = connectors.find((c) => c.id === pref.id);
      if (connector && pref.condition) {
        return connector;
      }
    }

    return connectors.find((c) => c.id !== 'farcaster');
  }, [connectors]);

  // Handle initial connection
  const ensureConnection = async () => {
    if (isConnected) {
      return true;
    }

    try {
      setError(null);
      const connector = await getPreferredConnector();

      if (!connector) {
        throw new Error('No suitable connector found');
      }

      await connectAsync({
        connector,
        chainId,
      });

      return true;
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage =
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : 'Failed to connect. Please try again.';
      setError(errorMessage);
      return false;
    }
  };

  return {
    isConnected,
    isConnectedToCorrectChain: currentChainId === chainId,
    address,
    error,
    ensureConnection,
    disconnect,
    chainId: currentChainId,
    targetChainId: chainId,
  };
}
