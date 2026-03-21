import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = (onEvent) => {
  const { user }    = useAuth();
  const socketRef   = useRef(null);
  const onEventRef  = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!user) return;
    const socket = io(
      process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001',
      { transports: ['websocket'], autoConnect: true }
    );
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { userId: user._id, role: user.role });
    });

    const events = ['approval_request', 'visitor_approved', 'visitor_denied', 'new_alert'];
    events.forEach(ev => {
      socket.on(ev, (data) => onEventRef.current?.(ev, data));
    });

    return () => socket.disconnect();
  }, [user?._id]);

  return socketRef.current;
};
