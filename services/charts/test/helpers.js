import { createClient } from '../../common/test/helpers.js';

/**
 * Create an MCP client connected to the charts service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createChartsClient = async () => {
  return createClient('services/charts/src/index.ts', 'charts-test-client');
};

export { createChartsClient }; 