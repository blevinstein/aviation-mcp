const { parseString } = require('xml2js');

/**
 * Parse an XML string into a JavaScript object using xml2js.
 * @param {string} xmlString - The XML string to parse
 * @returns {Promise<object>} The parsed XML as a JavaScript object
 */
const parseXmlResponse = (xmlString) => {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

module.exports = {
  parseXmlResponse
}; 