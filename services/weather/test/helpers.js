import { createClient } from '../../common/test/helpers.js';

/**
 * Create an MCP client connected to the weather service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createWeatherClient = async () => {
  return createClient('services/weather/src/index.ts', 'weather-test-client');
};

export { createWeatherClient }; 