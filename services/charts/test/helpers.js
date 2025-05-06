import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '../../common/test/helpers.js';

const BASE_URL = 'https://external-api.faa.gov/apra';

const getHeaders = () => ({
  client_id: process.env.FAA_ADIP_CLIENT_ID,
  client_secret: process.env.FAA_ADIP_CLIENT_SECRET
});

/**
 * Makes a direct HTTP request to the FAA APRA API
 * @deprecated Use MCP client instead
 */
const makeRequest = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, { headers: getHeaders() });
  const text = await response.text();
  return { status: response.status, text };
};

/**
 * Create an MCP client connected to the charts service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createChartsClient = async () => {
  return createClient('services/charts/src/index.ts', 'charts-test-client');
};

export { makeRequest, createChartsClient, getHeaders }; 