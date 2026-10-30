import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkInitial = async () => {
      try {
        const status = await Network.getStatus();
        setIsConnected(status.connected);
      } catch (err) {
        console.warn('Network plugin check error:', err);
      }
    };

    checkInitial();

    const listener = Network.addListener('networkStatusChange', (status) => {
      setIsConnected(status.connected);
    });

    return () => {
      listener.then(h => h.remove()).catch(() => {});
    };
  }, []);

  const recheckNetwork = async () => {
    setIsChecking(true);
    try {
      const status = await Network.getStatus();
      setTimeout(() => {
        setIsConnected(status.connected);
        setIsChecking(false);
      }, 500);
    } catch {
      setIsChecking(false);
    }
  };

  return { isConnected, isChecking, recheckNetwork };
}

