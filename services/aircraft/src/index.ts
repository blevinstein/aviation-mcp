#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Types matching SDK 1.0.1
interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

const DEBUG = process.env.DEBUG === 'true';
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

const AIRCRAFT_TOOL: Tool = {
  name: "search_aircraft",
  description: "Search for aircraft by manufacturer, model, engine type, speed, range, size, etc.",
  inputSchema: {
    type: "object",
    properties: {
      manufacturer: { type: "string", description: "Company that built the aircraft" },
      model: { type: "string", description: "Aircraft model name" },
      engine_type: { type: "string", enum: ["piston", "propjet", "jet"], description: "Type of engine" },
      min_speed: { type: "number", description: "Minimum max air speed in knots" },
      max_speed: { type: "number", description: "Maximum max air speed in knots" },
      min_range: { type: "number", description: "Minimum range in nautical miles" },
      max_range: { type: "number", description: "Maximum range in nautical miles" },
      min_length: { type: "number", description: "Minimum length in feet" },
      max_length: { type: "number", description: "Maximum length in feet" },
      min_height: { type: "number", description: "Minimum height in feet" },
      max_height: { type: "number", description: "Maximum height in feet" },
      min_wingspan: { type: "number", description: "Minimum wingspan in feet" },
      max_wingspan: { type: "number", description: "Maximum wingspan in feet" },
      limit: { type: "number", minimum: 1, maximum: 30, default: 1, description: "How many results to return (1-30)" }
    },
    additionalProperties: false
  }
};

function requireApiKey() {
  if (!process.env.API_NINJA_KEY) {
    throw new Error('API_NINJA_KEY is required in environment for Aircraft API');
  }
}

function hasAtLeastOneSearchParam(args) {
  const keys = Object.keys(args || {}).filter(k => k !== 'limit');
  return keys.length > 0;
}

async function handleSearchAircraft(args) {
  requireApiKey();
  if (!hasAtLeastOneSearchParam(args)) {
    throw new Error('At least one search parameter (other than limit) must be provided');
  }
  const url = new URL('https://api.api-ninjas.com/v1/aircraft');
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value.toString());
    }
  }
  debugLog('Aircraft API request:', url.toString());
  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': process.env.API_NINJA_KEY
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Aircraft API Error (${response.status}): ${errorText}`);
  }
  const data = await response.text();
  return {
    content: [{ type: "text", text: data }],
    isError: false
  };
}

const server = new Server(
  {
    name: "mcp-server/aircraft",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog('Received ListTools request');
  return { tools: [AIRCRAFT_TOOL] };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  debugLog('Received CallTool request:', { name: request.params.name, args: request.params.arguments });
  try {
    switch (request.params.name) {
      case "search_aircraft":
        return await handleSearchAircraft(request.params.arguments);
      default:
        debugLog('Unknown tool:', request.params.name);
        return {
          content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
          isError: true
        };
    }
  } catch (error) {
    debugLog('Error handling tool call:', error);
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aircraft MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 