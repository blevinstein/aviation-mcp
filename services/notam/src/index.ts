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

// Export TOOLS array for use by the main server
export const TOOLS: Tool[] = [
  {
    name: "get_notams",
    description: "Retrieves NOTAMs based on specified filters",
    inputSchema: {
      type: "object",
      properties: {
        responseFormat: {
          type: "string",
          enum: ["aixm", "geoJson", "aidap"],
          default: "geoJson",
          description: "Response format for NOTAM data"
        },
        icaoLocation: {
          type: "string",
          description: "The ICAO location criteria (e.g., 'KIAD' for Dulles International Airport)"
        },
        domesticLocation: {
          type: "string",
          description: "The domestic location criteria (e.g., 'IAD' for Dulles International Airport)"
        },
        notamType: {
          type: "string",
          enum: ["N", "R", "C"],
          description: "The NOTAM type: 'N' for New, 'R' for Replaced, 'C' for Canceled"
        },
        classification: {
          type: "string",
          enum: ["INTL", "MIL", "DOM", "LMIL", "FDC"],
          description: "The NOTAM classification"
        },
        notamNumber: {
          type: "string",
          description: "The NOTAM number (e.g., 'CK0000/01')"
        },
        effectiveStartDate: {
          type: "string",
          description: "The effective start date"
        },
        effectiveEndDate: {
          type: "string",
          description: "The effective end date"
        },
        featureType: {
          type: "string",
          enum: [
            "RWY", "TWY", "APRON", "AD", "OBST", "NAV", "COM", "SVC", "AIRSPACE",
            "ODP", "SID", "STAR", "CHART", "DATA", "DVA", "IAP", "VFP", "ROUTE",
            "SPECIAL", "SECURITY", "MILITARY", "INTERNATIONAL"
          ],
          description: "The feature type filter"
        },
        locationLongitude: {
          type: "number",
          description: "The location longitude (e.g., -151.24)"
        },
        locationLatitude: {
          type: "number",
          description: "The location latitude (e.g., 60.57)"
        },
        locationRadius: {
          type: "number",
          description: "The location radius in nautical miles (max: 100)"
        },
        lastUpdatedDate: {
          type: "string",
          description: "The last update date"
        },
        sortBy: {
          type: "string",
          enum: [
            "icaoLocation", "domesticLocation", "notamType", "notamNumber",
            "effectiveStartDate", "effectiveEndDate", "featureType"
          ],
          description: "The field to sort results by"
        },
        sortOrder: {
          type: "string",
          enum: ["Asc", "Desc"],
          description: "The sort order"
        },
        pageSize: {
          type: "number",
          default: 50,
          description: "The page size (max: 1000)"
        },
        pageNum: {
          type: "number",
          default: 1,
          description: "The page number"
        },
      },
    }
  }
];

/**
 * Handles NOTAM requests 
 */
async function handleNotams(
  responseFormat?: string,
  icaoLocation?: string,
  domesticLocation?: string,
  notamType?: string,
  classification?: string,
  notamNumber?: string,
  effectiveStartDate?: string,
  effectiveEndDate?: string,
  featureType?: string,
  locationLongitude?: number,
  locationLatitude?: number,
  locationRadius?: number,
  lastUpdatedDate?: string,
  sortBy?: string,
  sortOrder?: string,
  pageSize?: number,
  pageNum?: number,
) {
  // Set default format if not provided
  responseFormat = responseFormat || 'geoJson';
  
  // Construct the URL with query parameters
  const baseUrl = 'https://external-api.faa.gov/notamapi/v1/notams';
  const urlParams = new URLSearchParams();
  
  // Add parameters to URL if they exist
  if (responseFormat) urlParams.append('responseFormat', responseFormat);
  if (icaoLocation) urlParams.append('icaoLocation', icaoLocation);
  if (domesticLocation) urlParams.append('domesticLocation', domesticLocation);
  if (notamType) urlParams.append('notamType', notamType);
  if (classification) urlParams.append('classification', classification);
  if (notamNumber) urlParams.append('notamNumber', notamNumber);
  if (effectiveStartDate) urlParams.append('effectiveStartDate', effectiveStartDate);
  if (effectiveEndDate) urlParams.append('effectiveEndDate', effectiveEndDate);
  if (featureType) urlParams.append('featureType', featureType);
  if (locationLongitude !== undefined) urlParams.append('locationLongitude', locationLongitude.toString());
  if (locationLatitude !== undefined) urlParams.append('locationLatitude', locationLatitude.toString());
  if (locationRadius !== undefined) urlParams.append('locationRadius', locationRadius.toString());
  if (lastUpdatedDate) urlParams.append('lastUpdatedDate', lastUpdatedDate);
  if (sortBy) urlParams.append('sortBy', sortBy);
  if (sortOrder) urlParams.append('sortOrder', sortOrder);
  if (pageSize !== undefined) urlParams.append('pageSize', pageSize.toString());
  if (pageNum !== undefined) urlParams.append('pageNum', pageNum.toString());
  
  const url = `${baseUrl}?${urlParams.toString()}`;
  
  // Check if required auth credentials are provided
  if (!process.env.FAA_CLIENT_ID || !process.env.FAA_CLIENT_SECRET) {
    throw new Error('Client ID and Client Secret are required for NOTAM API authentication');
  }
  
  // Make the request with authentication headers
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'client_id': process.env.FAA_CLIENT_ID,
      'client_secret': process.env.FAA_CLIENT_SECRET
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NOTAM API Error (${response.status}): ${errorText}`);
  }
  
  const data = await response.text();
  return {
    content: [
      {
        type: "text",
        text: data
      }
    ],
    isError: false
  };
}

export async function handleToolCall(toolName: string, args: any) {
  debugLog('Received CallTool request:', { name: toolName, args });
  
  try {
    switch (toolName) {
      case "get_notams": {
        const {
          responseFormat,
          icaoLocation,
          domesticLocation,
          notamType,
          classification,
          notamNumber,
          effectiveStartDate,
          effectiveEndDate,
          featureType,
          locationLongitude,
          locationLatitude,
          locationRadius,
          lastUpdatedDate,
          sortBy,
          sortOrder,
          pageSize,
          pageNum,
        } = args;
        
        return await handleNotams(
          responseFormat,
          icaoLocation,
          domesticLocation,
          notamType,
          classification,
          notamNumber,
          effectiveStartDate,
          effectiveEndDate,
          featureType,
          locationLongitude,
          locationLatitude,
          locationRadius,
          lastUpdatedDate,
          sortBy,
          sortOrder,
          pageSize,
          pageNum,
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