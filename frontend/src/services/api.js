import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const getServices = async () => {
  const response = await api.get('/services');
  return response.data;
};

export const getService = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};

export const toggleService = async (serviceId) => {
  const response = await api.post(`/services/${serviceId}/toggle`);
  return response.data;
};

export const createToken = async (serviceId) => {
  const response = await api.post('/tokens', { serviceId });
  return response.data;
};

export const cancelToken = async (tokenId) => {
  const response = await api.post(`/tokens/${tokenId}/cancel`);
  return response.data;
};

export const getTokenStatus = async (tokenId) => {
  const response = await api.get(`/tokens/${tokenId}/status`);
  return response.data;
};

export const getQueueStatus = async (serviceId) => {
  const response = await api.get(`/tokens/queue/${serviceId}`);
  return response.data;
};

export const getAnalytics = async (serviceId) => {
  const response = await api.get(`/tokens/analytics/${serviceId}`);
  return response.data;
};

export const completeToken = async (serviceId) => {
  const response = await api.post(`/tokens/queue/${serviceId}/complete`);
  return response.data;
};

export default api;
