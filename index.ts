#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool definitions and handlers from each service
import * as Weather from './services/weather/src/index.js';
import * as Charts from './services/charts/src/index.js';
//import * as Precipitation from './services/precipitation/src/index.js';
//import * as Airports from './services/airports/src/index.js';
import * as Notam from './services/notam/src/index.js';
import * as Aircraft from './services/aircraft/src/index.js';

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

// Register process error handlers
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  // Don't exit immediately to allow logging
  setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});

process.on('exit', (code) => {
  console.error(`[INFO] Process exiting with code ${code}`);
});

// Authentication check functions
function hasFaaAuth() {
  return !!(process.env.FAA_CLIENT_ID && process.env.FAA_CLIENT_SECRET);
}

function hasAircraftApiKey() {
  return !!process.env.API_NINJA_KEY;
}

const server = new Server(
  {
    name: "aviation-mcp",
    version: "1.0.3",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  let allTools = [
    // Weather tools are always available
    ...Weather.TOOLS,
    ...Charts.TOOLS,
    
    //...(hasFaaAuth() ? Precipitation.TOOLS : []),
    //...(hasFaaAuth() ? Airports.TOOLS : []),
    ...(hasFaaAuth() ? Notam.TOOLS : []),
    ...(hasAircraftApiKey() ? Aircraft.TOOLS : [])
  ];
  
  debugLog(`ListTools: ${allTools.length} tools`);
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const toolName = request.params.name;
  const args = request.params.arguments;

  try {
    // Route to proper service based on tool name
    if (Weather.TOOLS.map(t => t.name).includes(toolName)) {
      return await Weather.handleToolCall(toolName, args);
    }
    
    if (Charts.TOOLS.map(t => t.name).includes(toolName)) {
      if (!hasFaaAuth()) {
        return {
          content: [{ type: "text", text: "FAA authentication required for charts tools" }],
          isError: true
        };
      }
      return await Charts.handleToolCall(toolName, args);
    }
    
    /*
    if (Precipitation.TOOLS.map(t => t.name).includes(toolName)) {
      if (!hasFaaAuth()) {
        return {
          content: [{ type: "text", text: "FAA authentication required for precipitation tools" }],
          isError: true
        };
      }
      return await Precipitation.handleToolCall(toolName, args);
    }
    
    if (Airports.TOOLS.map(t => t.name).includes(toolName)) {
      if (!hasFaaAuth()) {
        return {
          content: [{ type: "text", text: "FAA authentication required for airports tools" }],
          isError: true
        };
      }
      return await Airports.handleToolCall(toolName, args);
    }
    */
    
    if (Notam.TOOLS.map(t => t.name).includes(toolName)) {
      if (!hasFaaAuth()) {
        return {
          content: [{ type: "text", text: "FAA authentication required for NOTAM tools" }],
          isError: true
        };
      }
      return await Notam.handleToolCall(toolName, args);
    }
    
    if (Aircraft.TOOLS.map(t => t.name).includes(toolName)) {
      if (!hasAircraftApiKey()) {
        return {
          content: [{ type: "text", text: "Aircraft API authentication required for aircraft tools" }],
          isError: true
        };
      }
      return await Aircraft.handleToolCall(toolName, args);
    }
    
    return {
      content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
      isError: true
    };
    
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
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("[FATAL] Failed to start server:", error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 