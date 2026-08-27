import { useState, useEffect, useCallback } from 'react';
import { getServices, getTokenStatus, getQueueStatus, getAnalytics } from '../services/api';
import { getSocket } from '../services/socket';

export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getServices();
      setServices(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
};

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
    if (socket && tokenId) {
      socket.emit('join:service', status?.service?._id);
      const handler = () => fetchStatus();
      socket.on('queue:update', handler);
      return () => socket.off('queue:update', handler);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchStatus, tokenId]);

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
    if (socket && serviceId) {
      socket.emit('join:service', serviceId);
      const handler = (data) => {
        if (data.serviceId === serviceId) fetchQueue();
      };
      socket.on('queue:update', handler);
      socket.on('service:update', handler);
      return () => {
        socket.off('queue:update', handler);
        socket.off('service:update', handler);
      };
    }
  }, [fetchQueue, serviceId]);

  return { queue, loading, error, refetch: fetchQueue };
};

export const useAnalytics = (serviceId) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!serviceId) return;
    try {
      setLoading(true);
      const data = await getAnalytics(serviceId);
      setAnalytics(data);
      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchAnalytics();
    const socket = getSocket();
    if (socket && serviceId) {
      const handler = (data) => {
        if (data.serviceId === serviceId) fetchAnalytics();
      };
      socket.on('queue:update', handler);
      return () => socket.off('queue:update', handler);
    }
  }, [fetchAnalytics, serviceId]);

  return { analytics, loading, refetch: fetchAnalytics };
};
