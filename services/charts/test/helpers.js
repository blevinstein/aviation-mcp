require('dotenv').config();
const fetch = require('node-fetch');

const BASE_URL = 'https://external-api.faa.gov/apra';

const getHeaders = () => ({
  client_id: process.env.FAA_ADIP_CLIENT_ID,
  client_secret: process.env.FAA_ADIP_CLIENT_SECRET
});

const makeRequest = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, { headers: getHeaders() });
  const text = await response.text();
  return { status: response.status, text };
};

module.exports = {
  makeRequest,
  getHeaders
}; 