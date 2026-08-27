import { useState, useEffect, useCallback } from 'react';
import { getTokenStatus, getQueueStatus } from '../services/api';
import { getSocket } from '../services/socket';

export const useTokenStatus = (tokenId) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!tokenId) return;
    try {
      setLoading(true);
      const data = await getTokenStatus(tokenId);
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch token status');
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    fetchStatus();
    const socket = getSocket();
    if (socket) {
      const handler = () => fetchStatus();
      socket.on('queue:update', handler);
      return () => socket.off('queue:update', handler);
    }
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};

export const useQueueStatus = (serviceId) => {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = useCallback(async () => {
    if (!serviceId) return;
    try {
      setLoading(true);
      const data = await getQueueStatus(serviceId);
      setQueue(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchQueue();
    const socket = getSocket();
    if (socket) {
      const handler = (data) => {
        if (data.serviceId === serviceId) fetchQueue();
      };
      socket.on('queue:update', handler);
      return () => socket.off('queue:update', handler);
    }
  }, [fetchQueue, serviceId]);

  return { queue, loading, error, refetch: fetchQueue };
};
