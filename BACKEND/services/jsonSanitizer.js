/**
 * ExamGen AI Pro - JSON Sanitizer Utility
 * Sanitizes raw LLM output strings to ensure they are valid JSON before parsing.
 */

/**
 * Clean and escape invalid sequences in a JSON string
 * @param {string} str - Raw JSON string
 * @returns {string} - Sanitized JSON string
 */
const cleanJsonString = (str) => {
  if (!str) return '';

  let cleaned = str.trim();

  // Remove UTF-8 BOM if present
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.substring(1);
  }

  // Strip Markdown JSON code block wrappers if they slip through
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Escape lone backslashes that are not part of valid JSON escape sequences.
  // Valid JSON escapes: \", \\, \/, \b, \f, \n, \r, \t, or \uXXXX
  cleaned = cleaned.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');

  return cleaned;
};

/**
 * Safely parse a JSON string, applying sanitization fallbacks if necessary
 * @param {string} str - Raw JSON string
 * @returns {Object} - Parsed JSON object
 */
const safeJsonParse = (str) => {
  const sanitized = cleanJsonString(str);
  try {
    return JSON.parse(sanitized);
  } catch (error) {
    console.error('❌ JSON parse error. Original text length:', str.length);
    console.error('Parsing error message:', error.message);
    
    // Fallback: try replacing literal newlines/control characters inside quotes
    try {
      const escapedNewlines = sanitized.replace(/[\n\r\t]/g, (match) => {
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return match;
      });
      return JSON.parse(escapedNewlines);
    } catch (secondError) {
      throw error; // Throw original error so developer knows where it initially failed
    }
  }
};

module.exports = {
  cleanJsonString,
  safeJsonParse
};
