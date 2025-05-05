# Aviation Weather MCP Integration

This MCP integration provides access to the Aviation Weather API, allowing AI assistants to retrieve weather data including METARs, TAFs, PIREPs, and more.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API credentials to `.env`:
   ```
   AVIATION_WEATHER_API_KEY=your_api_key_here
   ```

3. The MCP tools will automatically use these credentials for authentication.

## Available Tools

### 1. Get METAR
Retrieves current METAR data for one or more stations.

Example usage in an AI assistant:
```
Get the current METAR for KJFK
```

Parameters:
- `ids` (required): Station ID(s) (e.g., 'KJFK', 'KLAX,KJFK')
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'
- `hours` (optional): Number of hours of historical data to retrieve
- `mostRecent` (optional): Whether to return only the most recent observation

### 2. Get TAF
Retrieves TAF forecasts for one or more stations.

Example usage in an AI assistant:
```
Get the TAF for KJFK
```

Parameters:
- `ids` (required): Station ID(s) (e.g., 'KJFK', 'KLAX,KJFK')
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

### 3. Get PIREP
Retrieves pilot reports (PIREPs) for a specific region.

Example usage in an AI assistant:
```
Get PIREPs for the New York area
```

Parameters:
- `type` (optional): Report type ('PIREP' or 'AIREP'), defaults to 'PIREP'
- `location` (optional): Geographic location or bounding box
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

### 4. Get Wind & Temperature Aloft
Retrieves wind and temperature data for specific altitudes.

Example usage in an AI assistant:
```
Get wind and temperature aloft for 3000ft
```

Parameters:
- `region` (required): Geographic region
- `altitude` (required): Altitude in feet
- `forecast` (optional): Forecast period
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

### 5. Get Station Information
Retrieves information about weather stations.

Example usage in an AI assistant:
```
Get information about KJFK weather station
```

Parameters:
- `id` (optional): Station ID
- `bbox` (optional): Bounding box coordinates
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

### 6. Get Airport Information
Retrieves information about airports.

Example usage in an AI assistant:
```
Get information about KJFK airport
```

Parameters:
- `id` (optional): Airport ID
- `bbox` (optional): Bounding box coordinates
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

### 7. Get Navaid Information
Retrieves information about navigational aids.

Example usage in an AI assistant:
```
Get information about the JFK VOR
```

Parameters:
- `id` (optional): Navaid ID
- `bbox` (optional): Bounding box coordinates
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

### 8. Get Fix Information
Retrieves information about navigational fixes.

Example usage in an AI assistant:
```
Get information about the JFK fix
```

Parameters:
- `id` (optional): Fix ID
- `bbox` (optional): Bounding box coordinates
- `format` (optional): Response format ('xml' or 'json'), defaults to 'xml'

## Development

### Testing the API

You can test the API directly using curl:

```bash
# Get METAR data
curl "https://aviationweather.gov/data/api/metar?ids=KJFK&format=xml"

# Get TAF data
curl "https://aviationweather.gov/data/api/taf?ids=KJFK&format=xml"

# Get PIREPs
curl "https://aviationweather.gov/data/api/pirep?type=PIREP&format=xml"
```

### Environment Variables

The integration requires the following environment variables:

| Variable | Description |
|----------|-------------|
| `AVIATION_WEATHER_API_KEY` | Your Aviation Weather API key |

## Notes

- This service provides access to official aviation weather data
- Data is updated in real-time for current conditions
- Historical data is available for research and analysis
- Rate limits and usage restrictions apply as per the API's terms of service
- The service implements automatic retry with exponential backoff for transient errors (503/504) 