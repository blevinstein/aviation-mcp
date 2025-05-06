import { createClient } from '../../common/test/helpers.js';

/**
 * Create an MCP client connected to the airports service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createAirportsClient = async () => {
  return createClient('services/airports/src/index.ts', 'airports-test-client');
};

export { createAirportsClient }; 