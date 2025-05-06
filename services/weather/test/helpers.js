import fetch from 'node-fetch';
import { createClient } from '../../common/test/helpers.js';

const BASE_URL = 'https://aviationweather.gov';

/**
 * Makes a direct HTTP request to the aviation weather API
 * @deprecated Use MCP client instead
 */
const makeRequest = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url);
  const text = await response.text();
  return { status: response.status, text };
};

/**
 * Create an MCP client connected to the weather service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createWeatherClient = async () => {
  return createClient('services/weather/src/index.ts', 'weather-test-client');
};

export { makeRequest, createWeatherClient }; 