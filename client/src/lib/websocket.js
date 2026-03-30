import { useState, useEffect } from 'react';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.shouldReconnect = true;

    // automatically respond to browser connectivity changes
    this.initConnectivityListeners();
  }

  // listen for browser online/offline events and react accordingly
  initConnectivityListeners() {
    if (typeof window === 'undefined' || !window.addEventListener) return;

    window.addEventListener('online', () => {
      console.log('Browser is online, attempting WS reconnect');
      this.connect();
    });

    window.addEventListener('offline', () => {
      console.warn('Browser went offline, disconnecting WS');
      this.disconnect();
    });
  }

  connect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Don't create new connection if already connecting or connected
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connecting or connected');
      return;
    }

    // if offline, bail early and reconnect when back online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('Network offline, delaying WebSocket connection');
      return;
    }

    // Get the WebSocket URL from environment variables or use a default
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.host}`;
    
    try {
      console.log(`Attempting WebSocket connection to: ${wsUrl}/ws/admin`);
      this.socket = new WebSocket(`${wsUrl}/ws/admin`);
      this.isConnected = false;

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.shouldReconnect = true;
      
      // Notify all subscribers that connection is established
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
        console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
        this.notifySubscribers({ 
          type: 'parse_error', 
          error: error.message,
          rawData: event.data
        });
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      });
      
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
      
      // Only reconnect if it wasn't a clean closure or we're supposed to reconnect
      if (this.shouldReconnect && (!event.wasClean || event.code !== 1000)) {
        this.handleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      // minimal logging; verbose data rarely useful and causes noise
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

      if (event && Object.keys(event).length) {
        console.warn('WebSocket error:', errorMessage, event);
      } else {
        console.warn('WebSocket error:', errorMessage);
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

      // attempt reconnect if offline or socket closed
      if (offline || state === WebSocket.CLOSED) {
        this.handleReconnect();
      }
    };
  }

  getReadyStateText(state) {
    switch(state) {
      case WebSocket.CONNECTING: return 'CONNECTING (0)';
      case WebSocket.OPEN: return 'OPEN (1)';
      case WebSocket.CLOSING: return 'CLOSING (2)';
      case WebSocket.CLOSED: return 'CLOSED (3)';
      default: return `UNKNOWN (${state})`;
    }
  }

  handleReconnect() {
    if (!this.shouldReconnect) {
      console.log('Reconnect disabled');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
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
    
    console.log(`Attempting to reconnect in ${Math.round(delay)}ms... (Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts} starting...`);
      this.connect();
    }, delay);
  }

  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    if (this.subscribers.has(channel)) {
      this.subscribers.get(channel).delete(callback);
      
      // Clean up empty channel sets
      if (this.subscribers.get(channel).size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }

  notifySubscribers(data) {
    const { type, ...rest } = data;
    const channelSubscribers = this.subscribers.get(type) || new Set();
    
    channelSubscribers.forEach(callback => {
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
          message: message
        });
        return false;
      }
    }
    
    console.warn('WebSocket is not connected. Current state:', this.getReadyStateText(this.socket?.readyState));
    
    // Queue message or notify about failure
    this.notifySubscribers({
      type: 'send_failed',
      reason: 'not_connected',
      message: message,
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
      // Set readyState before closing to prevent race conditions
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

  // Force immediate reconnect
  reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  // Get connection status
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

// Create a singleton instance
export const webSocketService = new WebSocketService();

// Auto-connect when imported (client-side only)
if (typeof window !== 'undefined') {
  // Wait for window to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      webSocketService.connect();
    });
  } else {
    webSocketService.connect();
  }
}

// Export a React hook for easier usage in components
export function useWebSocket(channel, callback) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});

  useEffect(() => {
    // Handle data updates
    const handleData = (newData) => {
      setData(newData);
      setError(null); // Clear any previous errors
      if (callback) {
        try {
          callback(newData);
        } catch (error) {
          console.error('Callback error:', error);
        }
      }
    };

    // Handle connection status changes
    const handleConnection = (statusData) => {
      setIsConnected(webSocketService.isConnected);
      setConnectionStatus({
        ...statusData,
        timestamp: new Date().toISOString()
      });
      
      // Clear error on successful connection
      if (statusData.status === 'connected') {
        setError(null);
      }
    };

    // Handle error events
    const handleError = (errorData) => {
      setError(errorData);
      console.error('WebSocket error in hook:', errorData);
    };

    // Subscribe to the specified channel
    const unsubscribeData = webSocketService.subscribe(channel, handleData);
    
    // Subscribe to connection status changes
    const unsubscribeConnection = webSocketService.subscribe('connection', handleConnection);
    
    // Subscribe to error events
    const unsubscribeError = webSocketService.subscribe('error', handleError);

    // Get initial status
    setConnectionStatus(webSocketService.getStatus());

    // Cleanup on unmount
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