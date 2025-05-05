const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('PIREP API', () => {
  test('should retrieve aircraft reports', async () => {
    const { status, text } = await makeRequest('/api/data/pirep', {
      format: 'xml'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);

      reports.forEach(report => {
        expect(report.receipt_time).toBeDefined();
        expect(report.observation_time).toBeDefined();
        expect(report.aircraft_ref).toBeDefined();
        expect(report.latitude).toBeDefined();
        expect(report.longitude).toBeDefined();
        expect(report.report_type).toBeDefined();
        expect(report.raw_text).toBeDefined();
      });
    }
  });

  test('should filter by report type PIREP', async () => {
    const { status, text } = await makeRequest('/api/data/pirep', {
      format: 'xml',
      type: 'pirep'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      reports.forEach(report => {
        expect(report.report_type[0]).toBe('PIREP');
      });
    }
  });

  test('should filter by report type AIREP', async () => {
    const { status, text } = await makeRequest('/api/data/pirep', {
      format: 'xml',
      type: 'airep'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      reports.forEach(report => {
        expect(report.report_type[0]).toBe('AIREP');
      });
    }
  });

  test('should filter by bounding box', async () => {
    const bbox = '-75,40,-70,45'; // Roughly covers parts of New England
    const { status, text } = await makeRequest('/api/data/pirep', {
      format: 'xml',
      bbox
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      reports.forEach(report => {
        const lat = parseFloat(report.latitude[0]);
        const lon = parseFloat(report.longitude[0]);
        expect(lat).toBeGreaterThanOrEqual(40);
        expect(lat).toBeLessThanOrEqual(45);
        expect(lon).toBeGreaterThanOrEqual(-75);
        expect(lon).toBeLessThanOrEqual(-70);
      });
    }
  });

  test('should handle reports with turbulence conditions', async () => {
    const { status, text } = await makeRequest('/api/data/pirep', {
      format: 'xml',
      type: 'pirep'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      const reportsWithTurbulence = reports.filter(report => report.turbulence_condition);
      if (reportsWithTurbulence.length > 0) {
        reportsWithTurbulence.forEach(report => {
          const turbulence = report.turbulence_condition[0];
          if (turbulence.$) {
            if (turbulence.$.turbulence_type) {
              expect(['CHOP', 'LLWS']).toContain(turbulence.$.turbulence_type);
            }
            if (turbulence.$.turbulence_intensity) {
              expect(['NEG', 'LGT', 'LGT-MOD', 'MOD']).toContain(turbulence.$.turbulence_intensity);
            }
          }
        });
      }
    }
  });

  test('should handle reports with icing conditions', async () => {
    const { status, text } = await makeRequest('/api/data/pirep', {
      format: 'xml',
      type: 'pirep'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      const reportsWithIcing = reports.filter(report => report.icing_condition);
      if (reportsWithIcing.length > 0) {
        reportsWithIcing.forEach(report => {
          const icing = report.icing_condition[0];
          if (icing.$) {
            if (icing.$.icing_type) {
              expect(['RIME']).toContain(icing.$.icing_type);
            }
            if (icing.$.icing_intensity) {
              expect(['NEG', 'NEGclr', 'TRC', 'LGT']).toContain(icing.$.icing_intensity);
            }
          }
        });
      }
    }
  });
}); 