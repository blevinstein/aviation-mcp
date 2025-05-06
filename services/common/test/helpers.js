import { parseString } from 'xml2js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve } from 'path';

/**
 * Parse an XML string into a JavaScript object using xml2js.
 * @param {string} xmlString - The XML string to parse
 * @returns {Promise<object>} The parsed XML as a JavaScript object
 */
export function parseXmlResponse (xmlString) {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

/**
 * Create and initialize an MCP client connected to a specified server module.
 * @param {string} serverPath - Path to the server module (relative to project root)
 * @param {string} [clientName="test-client"] - Name of the client
 * @returns {Promise<{client: Client, clientTransport: StdioClientTransport}>} The initialized client and transport
 */
export async function createClient(serverPath, clientName = "test-client") {
  const fullServerPath = resolve(serverPath);
  
  // Create a stdio transport that will start the server
  const clientTransport = new StdioClientTransport({
    command: 'node',
    args: [fullServerPath],
    name: serverPath
  });
  
  // Create and initialize client
  const client = new Client(
    {
      name: clientName,
      version: "1.0.0"
    }, 
    {
      capabilities: {
        tools: {}
      }
    }
  );
  
  await client.connect(clientTransport);
  
  return { client, clientTransport };
};