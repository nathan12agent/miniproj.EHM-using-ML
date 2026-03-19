import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const getAllBeds = (ward = '', status = '') => {
  const params = new URLSearchParams();
  if (ward && ward !== 'All') params.append('ward', ward);
  if (status) params.append('status', status);
  return axios.get(`${API}/beds?${params}`, getHeaders());
};

export const getBedStats = () =>
  axios.get(`${API}/beds/stats`, getHeaders());

export const updateBedStatus = (id, data) =>
  axios.put(`${API}/beds/${id}`, data, getHeaders());
