#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool definitions and handlers from each service
import * as Weather from './services/weather/src/index.ts';
import * as Charts from './services/charts/src/index.ts';
import * as Precipitation from './services/precipitation/src/index.ts';
import * as Airports from './services/airports/src/index.ts';
import * as Notam from './services/notam/src/index.ts';
import * as Aircraft from './services/aircraft/src/index.ts';

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

// Log environment details
debugLog('Process started with:');
debugLog('- Node version:', process.version);
debugLog('- Current directory:', process.cwd());
debugLog('- ENV vars:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')));
debugLog('- Arguments:', process.argv);

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
  console.error(`Checking FAA keys: ${process.env.FAA_CLIENT_ID}`);
  return !!(process.env.FAA_CLIENT_ID && process.env.FAA_CLIENT_SECRET);
}

function hasAircraftApiKey() {
  console.error(`Checking API Ninja key: ${process.env.API_NINJA_KEY?.substring(0, 4)}`);
  return !!process.env.API_NINJA_KEY;
}

// Server setup
debugLog('Creating MCP server');
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
  debugLog('Received ListTools request');
  
  let allTools = [
    // Weather tools are always available
    ...Weather.TOOLS,
    ...Charts.TOOLS,
    
    // Conditional tools based on auth
    ...(hasFaaAuth() ? Precipitation.TOOLS : []),
    ...(hasFaaAuth() ? Airports.TOOLS : []),
    ...(hasFaaAuth() ? Notam.TOOLS : []),
    ...(hasAircraftApiKey() ? Aircraft.TOOLS : [])
  ];
  
  debugLog(`Returning ${allTools.length} tools`);
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const toolName = request.params.name;
  const args = request.params.arguments;
  
  debugLog('Received CallTool request:', { name: toolName, args });
  
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
    
    // Unknown tool
    debugLog('Unknown tool:', toolName);
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
    debugLog('Initializing StdioServerTransport');
    const transport = new StdioServerTransport();
    
    debugLog('Connecting to transport');
    await server.connect(transport);
    
    console.error("Aviation MCP Server running on stdio");
    
    // Check if stdin/stdout are available
    debugLog('Checking stdin/stdout availability:');
    debugLog('- stdin isTTY:', process.stdin.isTTY);
    debugLog('- stdout isTTY:', process.stdout.isTTY);
    debugLog('- stderr isTTY:', process.stderr.isTTY);
  } catch (error) {
    console.error("[FATAL] Failed to start server:", error);
    process.exit(1);
  }
}

debugLog('About to start server');
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 