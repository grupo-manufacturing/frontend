'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('groupo_token') : null;
    
    if (!token) {
      return;
    }

    // Create socket connection with auth
    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      optionsRef.current.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      console.error('[useSocket] Connection error:', err);
      setError(err as Error);
      setIsConnected(false);
      optionsRef.current.onError?.(err as Error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Empty deps - only connect once

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  };
}

