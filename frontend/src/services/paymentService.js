import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const createOrder = (data, token) =>
  axios.post(`${API_URL}/payment/create-order`, data, getHeaders(token));

export const verifyPayment = (data, token) =>
  axios.post(`${API_URL}/payment/verify`, data, getHeaders(token));

export const getHistory = (token) =>
  axios.get(`${API_URL}/payment/history`, getHeaders(token));

export const getReceipt = (paymentId, token) =>
  axios.get(`${API_URL}/payment/receipt/${paymentId}`, getHeaders(token));
