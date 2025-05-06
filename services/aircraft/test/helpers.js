import { createClient } from '../../common/test/helpers.js';

/**
 * Create an MCP client connected to the aircraft service
 * @returns {Promise<{client: import('@modelcontextprotocol/sdk/client/index.js').Client, clientTransport: import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport}>}
 */
const createAircraftClient = async () => {
  return createClient('services/aircraft/src/index.ts', 'aircraft-test-client');
};

export { createAircraftClient }; 