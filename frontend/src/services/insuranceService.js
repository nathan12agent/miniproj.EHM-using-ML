import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getPolicy = (patientId, token) =>
  axios.get(`${API_URL}/insurance/policy/${patientId}`, getHeaders(token));

export const getPolicies = (token) =>
  axios.get(`${API_URL}/insurance/policies`, getHeaders(token));

export const createPolicy = (data, token) =>
  axios.post(`${API_URL}/insurance/policy`, data, getHeaders(token));

export const submitClaim = (data, token) =>
  axios.post(`${API_URL}/insurance/claim/submit`, data, getHeaders(token));

export const getClaims = (page = 1, token) =>
  axios.get(`${API_URL}/insurance/claims?page=${page}`, getHeaders(token));

export const reviewClaim = (claimId, data, token) =>
  axios.patch(`${API_URL}/insurance/claims/${claimId}/review`, data, getHeaders(token));

export const seedInsurance = (token) =>
  axios.post(`${API_URL}/insurance/seed`, {}, getHeaders(token));

export const fraudPrecheck = (features) =>
  axios.post('http://localhost:5001/insurance/fraud_detect', features);
