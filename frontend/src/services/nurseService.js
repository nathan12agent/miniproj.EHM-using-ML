import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const getAllNurses = (page = 1, limit = 20, ward = '', status = '') => {
  const params = new URLSearchParams({ page, limit });
  if (ward) params.append('ward', ward);
  if (status) params.append('status', status);
  return axios.get(`${API}/nurses?${params}`, getHeaders());
};

export const getNurseById = (id) =>
  axios.get(`${API}/nurses/${id}`, getHeaders());

export const createNurse = (data) =>
  axios.post(`${API}/nurses`, data, getHeaders());

export const updateNurse = (id, data) =>
  axios.put(`${API}/nurses/${id}`, data, getHeaders());

export const deleteNurse = (id) =>
  axios.delete(`${API}/nurses/${id}`, getHeaders());
