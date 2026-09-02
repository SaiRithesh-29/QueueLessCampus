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
  const [joinedServiceId, setJoinedServiceId] = useState(null);

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
  }, [fetchStatus]);

  // Join correct service room once status loads with service info
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !tokenId) return;
    const serviceId = status?.service?._id;
    if (!serviceId) return;
    if (joinedServiceId === serviceId) return;

    socket.emit('join:service', serviceId);
    setJoinedServiceId(serviceId);
  }, [tokenId, status, joinedServiceId]);

  // Subscribe to queue updates filtered by the correct service
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !tokenId || !joinedServiceId) return;

    const handler = (data) => {
      if (!data.serviceId || data.serviceId === joinedServiceId) {
        fetchStatus();
      }
    };
    socket.on('queue:update', handler);
    return () => socket.off('queue:update', handler);
  }, [fetchStatus, tokenId, joinedServiceId]);

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
