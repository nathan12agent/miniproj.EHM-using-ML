import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const ML_URL = 'http://localhost:5001';

const getHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const validatePolicy = (data, token) =>
  axios.post(`${API_URL}/insurance/validate`, data, getHeaders(token));

export const submitClaim = (data, token) =>
  axios.post(`${API_URL}/insurance/claim/submit`, data, getHeaders(token));

export const getClaims = (params = {}, token) =>
  axios.get(`${API_URL}/insurance/claims`, { ...getHeaders(token), params });

export const reviewClaim = (claimId, data, token) =>
  axios.patch(`${API_URL}/insurance/claim/${claimId}/review`, data, getHeaders(token));

export const fetchActiveClaim = (patientId, token) =>
  axios.get(`${API_URL}/insurance/patient/${patientId}/active-claim`, getHeaders(token));

export const getPolicy = (patientId, token) =>
  axios.get(`${API_URL}/insurance/policy/${patientId}`, getHeaders(token));

export const getPolicies = (token) =>
  axios.get(`${API_URL}/insurance/policies`, getHeaders(token));

export const createPolicy = (data, token) =>
  axios.post(`${API_URL}/insurance/policy`, data, getHeaders(token));

export const seedInsurance = (token) =>
  axios.post(`${API_URL}/insurance/seed`, {}, getHeaders(token));

export const fraudPrecheck = (features) =>
  axios.post(`${ML_URL}/insurance/fraud_detect`, features);

export const getBenchmarks = () =>
  axios.get(`${ML_URL}/insurance/benchmarks`);
