import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const getAllBeds = (ward = '', status = '', purpose = '') => {
  const params = new URLSearchParams();
  if (ward && ward !== 'All') params.append('ward', ward);
  if (status) params.append('status', status);
  if (purpose) params.append('purpose', purpose);
  return axios.get(`${API}/beds?${params}`, getHeaders());
};

export const getBedStats = () =>
  axios.get(`${API}/beds/stats`, getHeaders());

export const updateBedStatus = (id, data) =>
  axios.put(`${API}/beds/${id}`, data, getHeaders());

export const autoAllocatePatients = () =>
  axios.post(`${API}/beds/auto-allocate/patients`, {}, getHeaders());

export const autoAllocateDoctors = () =>
  axios.post(`${API}/beds/auto-allocate/doctors`, {}, getHeaders());

export const autoAllocateNurses = () =>
  axios.post(`${API}/beds/auto-allocate/nurses`, {}, getHeaders());

export const releaseAllDoctors = () =>
  axios.post(`${API}/beds/release-all/doctors`, {}, getHeaders());

export const releaseAllNurses = () =>
  axios.post(`${API}/beds/release-all/nurses`, {}, getHeaders());

export const releaseSingleBed = (bedId) =>
  axios.post(`${API}/beds/release/single`, { bedId }, getHeaders());
