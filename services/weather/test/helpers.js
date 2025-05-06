import fetch from 'node-fetch';

const BASE_URL = 'https://aviationweather.gov';

const makeRequest = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url);
  const text = await response.text();
  return { status: response.status, text };
};

export { makeRequest }; 