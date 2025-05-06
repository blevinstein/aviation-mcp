import { createClient } from '../../common/test/helpers.js';

/**
 * Create an MCP client connected to the notam service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createNotamClient = async () => {
  return createClient('services/notam/src/index.ts', 'notam-test-client');
};

export { createNotamClient }; 