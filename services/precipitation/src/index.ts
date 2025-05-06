#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Types matching SDK 1.0.1
interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

// Use dirname properly for ESM
const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * Define precipitation intensity codes
 * These codes are used to interpret the API response
 */
const PRECIPITATION_INTENSITY = {
  "-99": "No VIL value found",
  "-97": "No weather data available",
  "-1": "Clear skies",
  "0": "Very Light precipitation",
  "1": "Light precipitation",
  "2": "Light to moderate rain",
  "3": "Moderate to heavy rain",
  "4": "Heavy rain",
  "5": "Very heavy rain; hail possible",
  "6": "Very heavy rain and hail; large hail possible"
};

// Define the tools directly
const PRECIPITATION_TOOLS: Tool[] = [
  {
    name: "get-precipitation",
    description: "Retrieves precipitation intensity data for specified coordinates and times",
    inputSchema: {
      type: "object",
      properties: {
        points: {
          type: "array",
          description: "Array of coordinates and times to check precipitation",
          items: {
            type: "object",
            properties: {
              lat: {
                type: "number",
                description: "Latitude of point"
              },
              lon: {
                type: "number",
                description: "Longitude of point"
              },
              timeStr: {
                type: "string",
                description: "ISO 8601 UTC time string (yyyyMMddTHHmmss)"
              }
            },
            required: ["lat", "lon", "timeStr"]
          }
        },
        includeDescription: {
          type: "boolean",
          default: false,
          description: "Whether to include human-readable descriptions for precipitation codes"
        },
        clientId: {
          type: "string",
          description: "The client ID for API authentication"
        },
        clientSecret: {
          type: "string",
          description: "The client secret for API authentication"
        }
      },
      required: ["points", "clientId", "clientSecret"]
    }
  }
];

/**
 * Handles precipitation requests through the EIM Weather Proximity API
 */
async function handlePrecipitation(
  points: Array<{lat: number, lon: number, timeStr: string}>,
  includeDescription: boolean = false,
  clientId?: string,
  clientSecret?: string
) {
  // Check if required auth credentials are provided
  if (!clientId || !clientSecret) {
    throw new Error('Client ID and Client Secret are required for EIM API authentication');
  }

  // Check if points are provided
  if (!points || !Array.isArray(points) || points.length === 0) {
    throw new Error('At least one point must be provided');
  }

  // Prepare the points data - add prodId as required by the API
  const pointsWithProdId = points.map(point => ({
    ...point,
    prodId: "VIL" // Using VIL (Vertically Integrated Liquid Water) product
  }));

  // Make the API request
  const baseUrl = 'https://external-api.faa.gov/eim/services/proximityList';
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'client_id': clientId,
        'client_secret': clientSecret
      },
      body: JSON.stringify(pointsWithProdId)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EIM API Error (${response.status}): ${errorText}`);
    }
    
    // Parse the response data
    const intensityCodes = await response.json();

    // Add descriptions if requested
    let result;
    if (includeDescription) {
      result = {
        intensities: intensityCodes.map((code: number) => ({
          code,
          description: PRECIPITATION_INTENSITY[code.toString()] || "Unknown intensity code"
        }))
      };
    } else {
      result = { intensities: intensityCodes };
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result)
        }
      ],
      isError: false
    };
  } catch (error) {
    return {
        content: [
            {
                type: "text",
                text: error.message,
            }
        ],
        isError: true
    }
  }
}

// Server setup
const server = new Server(
  {
    name: "mcp-server/aviation-precipitation",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog('Received ListTools request');
  return {
    tools: PRECIPITATION_TOOLS
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  debugLog('Received CallTool request:', { name: request.params.name, args: request.params.arguments });
  
  try {
    switch (request.params.name) {
      case "get-precipitation": {
        const {
          points,
          includeDescription,
          clientId,
          clientSecret
        } = request.params.arguments;
        
        return await handlePrecipitation(
          points,
          includeDescription,
          clientId,
          clientSecret
        );
      }
      default:
        debugLog('Unknown tool:', request.params.name);
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    debugLog('Error handling tool call:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aviation Precipitation MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});