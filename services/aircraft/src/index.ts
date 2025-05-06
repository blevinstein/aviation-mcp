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

// Export tools for use by the main server
export const TOOLS: Tool[] = [
  {
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
  }
];

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

// Export unified handler function for the main server
export async function handleToolCall(toolName: string, args: any) {
  debugLog('Aircraft handleToolCall called with:', { toolName, args });
  try {
    switch (toolName) {
      case "search_aircraft":
        return await handleSearchAircraft(args);
      default:
        debugLog('Unknown tool:', toolName);
        return {
          content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
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
}
