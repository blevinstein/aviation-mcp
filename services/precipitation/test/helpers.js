import { createClient } from '../../common/test/helpers.js';

/**
 * Create an MCP client connected to the precipitation service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createPrecipitationClient = async () => {
  return createClient('services/precipitation/src/index.ts', 'precipitation-test-client');
};

export { createPrecipitationClient };