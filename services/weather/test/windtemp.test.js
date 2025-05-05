const { makeRequest } = require('./helpers');

describe('Wind & Temperature Aloft API', () => {
  test('should retrieve forecasts for all regions', async () => {
    const { status, text } = await makeRequest('/api/data/windtemp', {
      region: 'all',
      level: 'low',
      fcst: '06'
    });
    expect(status).toBe(200);
    expect(text).toMatch(/FD[0-9]US[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });

  test('should retrieve forecasts for specific region', async () => {
    const { status, text } = await makeRequest('/api/data/windtemp', {
      region: 'bos',
      level: 'low',
      fcst: '06'
    });
    expect(status).toBe(200);
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });

  test('should retrieve high altitude forecasts', async () => {
    const { status, text } = await makeRequest('/api/data/windtemp', {
      region: 'all',
      level: 'high',
      fcst: '06'
    });
    expect(status).toBe(200);
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
    expect(text).toContain('45000');  // High altitude levels
  });

  test('should retrieve forecasts for different time periods', async () => {
    const periods = ['06', '12', '24'];
    for (const fcst of periods) {
      const { status, text } = await makeRequest('/api/data/windtemp', {
        region: 'all',
        level: 'low',
        fcst
      });
      expect(status).toBe(200);
      expect(text).toMatch(/FD[0-9]/);
      expect(text).toContain('DATA BASED ON');
    }
  });

  test('should handle Alaska region forecasts', async () => {
    const { status, text } = await makeRequest('/api/data/windtemp', {
      region: 'alaska',
      level: 'low',
      fcst: '06'
    });
    expect(status).toBe(200);
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });

  test('should handle Hawaii region forecasts', async () => {
    const { status, text } = await makeRequest('/api/data/windtemp', {
      region: 'hawaii',
      level: 'low',
      fcst: '06'
    });
    expect(status).toBe(200);
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });
}); 