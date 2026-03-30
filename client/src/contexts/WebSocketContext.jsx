'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { webSocketService } from '@/lib/websocket';
import { useToast } from '@/components/ui/use-toast';

const WebSocketContext = createContext({
  isConnected: false,
  subscribe: () => () => {},
  send: () => {},
  reconnect: () => {},
});

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected);
  const { toast } = useToast();

  const handleConnectionChange = useCallback(({ status, message }) => {
    setIsConnected(status === 'connected');
    
    if (status === 'connected') {
      toast({
        title: 'Connected',
        description: 'Real-time updates are now active',
        variant: 'default',
      });
    } else if (status === 'disconnected') {
      toast({
        title: 'Disconnected',
        description: 'Real-time updates are paused. Attempting to reconnect...',
        variant: 'destructive',
      });
    } else if (status === 'failed') {
      toast({
        title: 'Connection Failed',
        description: message || 'Unable to connect to real-time updates',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleError = useCallback((error) => {
    // ignore completely empty payloads that sometimes come from the server
    // (e.g. { type: 'error' } with no additional fields). they aren't
    // actionable and only clutter the console/toasts.
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      return;
    }

    // error may also be a string or an object with an `error`/`message` field
    const msg = (error && error.error) || error?.message || error.toString() || 'Real-time connection error';

    // Only log if we actually have something useful to see
    if (typeof error === 'string' || (typeof error === 'object' && Object.keys(error).length > 0)) {
      console.error('WebSocket error:', error);
    }

    toast({
      title: 'Real-time update error',
      description: msg,
      variant: 'destructive',
    });
  }, [toast]);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribeConnection = webSocketService.subscribe('connection', handleConnectionChange);
    
    // Subscribe to error events
    const unsubscribeError = webSocketService.subscribe('error', handleError);

    // Connect if not already connected
    if (!isConnected) {
      webSocketService.connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribeConnection();
      unsubscribeError();
      // Don't disconnect here to maintain the connection across route changes
    };
  }, [handleConnectionChange, handleError, isConnected]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    webSocketService.connect();
  }, []);

  // Function to subscribe to a channel
  const subscribe = useCallback((channel, callback) => {
    return webSocketService.subscribe(channel, callback);
  }, []);

  // Function to send a message
  const send = useCallback((message) => {
    return webSocketService.send(message);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribe,
        send,
        reconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Custom hook for subscribing to real-time updates
export function useRealtime(channel, callback) {
  const [data, setData] = useState(null);
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleData = (newData) => {
      setData(newData);
      if (typeof callback === 'function') {
        callback(newData);
      }
    };

    const unsubscribe = subscribe(channel, handleData);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [channel, callback, subscribe, isConnected]);

  return data;
}

// Higher-order component for WebSocket connection status
export const withWebSocket = (WrappedComponent) => {
  return function WithWebSocket(props) {
    const { isConnected, reconnect } = useWebSocket();
    return (
      <WrappedComponent
        {...props}
        isWebSocketConnected={isConnected}
        reconnectWebSocket={reconnect}
      />
    );
  };
};
