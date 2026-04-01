import { useState, useEffect } from 'react';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.shouldReconnect = true;

    this.initConnectivityListeners();
  }

  initConnectivityListeners() {
    if (typeof window === 'undefined' || !window.addEventListener) return;

    window.addEventListener('online', () => {
      this.connect();
    });

    window.addEventListener('offline', () => {
      this.disconnect();
    });
  }

  connect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.host}`;

    try {
      this.socket = new WebSocket(`${wsUrl}/ws/admin`);
      this.isConnected = false;
      this.setupEventHandlers();
    } catch (error) {
      console.warn('Failed to create WebSocket:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.shouldReconnect = true;

      this.notifySubscribers({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers(data);
      } catch (error) {
        console.warn('Error parsing WebSocket message:', error);
        this.notifySubscribers({
          type: 'parse_error',
          error: error.message,
          rawData: event.data
        });
      }
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.socket = null;

      this.notifySubscribers({
        type: 'connection',
        status: 'disconnected',
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      });

      if (this.shouldReconnect && (!event.wasClean || event.code !== 1000)) {
        this.handleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      const state = this.socket?.readyState;

      let errorMessage = 'WebSocket connection error';
      if (offline) {
        errorMessage = 'Network is offline';
      } else if (state === WebSocket.CONNECTING) {
        errorMessage = 'Failed to establish connection';
      } else if (state === WebSocket.CLOSING || state === WebSocket.CLOSED) {
        errorMessage = 'Connection was closed';
      }

      this.notifySubscribers({
        type: 'error',
        error: errorMessage,
        details: {
          eventType: event?.type,
          readyState: state,
          readyStateText: this.getReadyStateText(state),
          url: this.socket?.url,
          timestamp: new Date().toISOString(),
          networkStatus: offline ? 'offline' : 'online',
          wasClean: false
        }
      });

      if (offline || state === WebSocket.CLOSED) {
        this.handleReconnect();
      }
    };
  }

  getReadyStateText(state) {
    switch (state) {
      case WebSocket.CONNECTING:
        return 'CONNECTING (0)';
      case WebSocket.OPEN:
        return 'OPEN (1)';
      case WebSocket.CLOSING:
        return 'CLOSING (2)';
      case WebSocket.CLOSED:
        return 'CLOSED (3)';
      default:
        return `UNKNOWN (${state})`;
    }
  }

  handleReconnect() {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifySubscribers({
        type: 'connection',
        status: 'failed',
        message: 'Unable to connect to server. Please refresh the page to try again.',
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);

    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    if (this.subscribers.has(channel)) {
      this.subscribers.get(channel).delete(callback);

      if (this.subscribers.get(channel).size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }

  notifySubscribers(data) {
    const { type, ...rest } = data;
    const channelSubscribers = this.subscribers.get(type) || new Set();

    channelSubscribers.forEach((callback) => {
      try {
        callback(rest);
      } catch (error) {
        console.error('Error in WebSocket subscriber callback:', error);
      }
    });
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.notifySubscribers({
          type: 'send_error',
          error: error.message,
          message
        });
        return false;
      }
    }

    this.notifySubscribers({
      type: 'send_failed',
      reason: 'not_connected',
      message,
      readyState: this.socket?.readyState
    });

    return false;
  }

  disconnect(permanent = false) {
    if (permanent) {
      this.shouldReconnect = false;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      const oldSocket = this.socket;
      this.socket = null;

      try {
        oldSocket.close(1000, 'Client disconnected');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }

      this.isConnected = false;
    }
  }

  reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.socket?.readyState,
      readyStateText: this.getReadyStateText(this.socket?.readyState),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      shouldReconnect: this.shouldReconnect
    };
  }
}

export const webSocketService = new WebSocketService();

export function useWebSocket(channel, callback) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});

  useEffect(() => {
    const handleData = (newData) => {
      setData(newData);
      setError(null);
      if (callback) {
        try {
          callback(newData);
        } catch (callbackError) {
          console.error('Callback error:', callbackError);
        }
      }
    };

    const handleConnection = (statusData) => {
      setIsConnected(webSocketService.isConnected);
      setConnectionStatus({
        ...statusData,
        timestamp: new Date().toISOString()
      });

      if (statusData.status === 'connected') {
        setError(null);
      }
    };

    const handleError = (errorData) => {
      setError(errorData);
      if (errorData && (typeof errorData !== 'object' || Object.keys(errorData).length > 0)) {
        console.warn('WebSocket error in hook:', errorData);
      }
    };

    const unsubscribeData = webSocketService.subscribe(channel, handleData);
    const unsubscribeConnection = webSocketService.subscribe('connection', handleConnection);
    const unsubscribeError = webSocketService.subscribe('error', handleError);

    setConnectionStatus(webSocketService.getStatus());

    return () => {
      unsubscribeData();
      unsubscribeConnection();
      unsubscribeError();
    };
  }, [channel, callback]);

  const send = (message) => {
    return webSocketService.send(message);
  };

  const reconnect = () => {
    webSocketService.reconnect();
  };

  const disconnect = (permanent = false) => {
    webSocketService.disconnect(permanent);
  };

  return {
    data,
    isConnected,
    error,
    connectionStatus,
    send,
    reconnect,
    disconnect,
    getStatus: () => webSocketService.getStatus()
  };
}
