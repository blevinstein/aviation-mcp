import fetch from "node-fetch";

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

export const TOOLS: Tool[] = [
  {
    name: "get_precipitation",
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
      },
      required: ["points"]
    }
  }
];

/**
 * Handles precipitation requests through the EIM Weather Proximity API
 */
async function handlePrecipitation(
  points: Array<{lat: number, lon: number, timeStr: string}>,
  includeDescription: boolean = false,
) {
  // Check if required auth credentials are provided
  if (!process.env.FAA_CLIENT_ID || !process.env.FAA_CLIENT_SECRET) {
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
        'client_id': process.env.FAA_CLIENT_ID,
        'client_secret': process.env.FAA_CLIENT_SECRET
      },
      body: JSON.stringify(pointsWithProdId)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`EIM API Error: ${errorText}`);
      throw new Error(`EIM API Error (${response.status}): ${errorText}`);
    }
    
    // Parse the response data
    const intensityCodes: number[] = await response.json() as number[];
    debugLog(`EIM API Response: ${JSON.stringify(intensityCodes)}`);

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
    debugLog(`Error: ${error.message}`);
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

// Export unified handler function for the main server
export async function handleToolCall(toolName: string, args: any) {
  debugLog('Precipitation handleToolCall called with:', { toolName, args });
  
  try {
    switch (toolName) {
      case "get_precipitation": {
        const {
          points,
          includeDescription,
        } = args;
        
        return await handlePrecipitation(
          points,
          includeDescription,
        );
      }
      default:
        debugLog('Unknown tool:', toolName);
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${toolName}`
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
}
