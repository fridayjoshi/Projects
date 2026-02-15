const cron = require('node-cron');
const cronstrue = require('cronstrue');

/**
 * Convert cron expression to human-readable description
 * @param {string} cronExpr - Standard cron expression (5 or 6 fields)
 * @param {object} options - Options for formatting
 * @returns {string} Human-readable description
 */
function toHuman(cronExpr, options = {}) {
  try {
    // Use cronstrue for basic conversion
    let description = cronstrue.toString(cronExpr, {
      use24HourTimeFormat: options.use24Hour !== false,
      verbose: options.verbose || false,
    });
    
    // Clean up some common verbose patterns for agent-friendly output
    if (!options.verbose) {
      description = description
        .replace(/^At /, '')
        .replace(/, only on /, ' on ')
        .replace(/, only in /, ' in ');
    }
    
    return description;
  } catch (error) {
    throw new Error(`Invalid cron expression: ${error.message}`);
  }
}

/**
 * Convert natural language to cron expression
 * @param {string} text - Natural language description
 * @returns {string} Cron expression
 */
function toCron(text) {
  const normalized = text.toLowerCase().trim();
  
  // Common patterns
  const patterns = [
    // Every X minutes/hours
    { regex: /every (\d+) minutes?/, cron: (m) => `*/${m[1]} * * * *` },
    { regex: /every (\d+) hours?/, cron: (m) => `0 */${m[1]} * * *` },
    { regex: /every hour/, cron: () => '0 * * * *' },
    { regex: /every minute/, cron: () => '* * * * *' },
    
    // Daily at specific time
    { regex: /every day at (\d+):(\d+)/, cron: (m) => `${m[2]} ${m[1]} * * *` },
    { regex: /every day at (\d+)([ap]m)/, cron: (m) => {
      let hour = parseInt(m[1]);
      if (m[2] === 'pm' && hour !== 12) hour += 12;
      if (m[2] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} * * *`;
    }},
    { regex: /daily at (\d+)([ap]m)/, cron: (m) => {
      let hour = parseInt(m[1]);
      if (m[2] === 'pm' && hour !== 12) hour += 12;
      if (m[2] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} * * *`;
    }},
    
    // Weekdays
    { regex: /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday) at (\d+)([ap]m)/, cron: (m) => {
      const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
      let hour = parseInt(m[2]);
      if (m[3] === 'pm' && hour !== 12) hour += 12;
      if (m[3] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} * * ${days[m[1]]}`;
    }},
    { regex: /every weekday at (\d+)([ap]m)/, cron: (m) => {
      let hour = parseInt(m[1]);
      if (m[2] === 'pm' && hour !== 12) hour += 12;
      if (m[2] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} * * 1-5`;
    }},
    
    // Monthly
    { regex: /every month on the (\d+)(?:st|nd|rd|th) at (\d+)([ap]m)/, cron: (m) => {
      let hour = parseInt(m[2]);
      if (m[3] === 'pm' && hour !== 12) hour += 12;
      if (m[3] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} ${m[1]} * *`;
    }},
    { regex: /first day of every month at (\d+)([ap]m)/, cron: (m) => {
      let hour = parseInt(m[1]);
      if (m[2] === 'pm' && hour !== 12) hour += 12;
      if (m[2] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} 1 * *`;
    }},
    
    // Special shortcuts
    { regex: /every night at midnight/, cron: () => '0 0 * * *' },
    { regex: /every morning at (\d+)([ap]m)/, cron: (m) => {
      let hour = parseInt(m[1]);
      if (m[2] === 'pm' && hour !== 12) hour += 12;
      if (m[2] === 'am' && hour === 12) hour = 0;
      return `0 ${hour} * * *`;
    }},
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return pattern.cron(match);
    }
  }
  
  throw new Error(`Could not parse natural language: "${text}". Try patterns like "every day at 9am" or "every monday at 3pm"`);
}

/**
 * Get next N execution times for a cron expression
 * @param {string} cronExpr - Cron expression
 * @param {object} options - Options (count, tz, startDate)
 * @returns {Array<string>} Array of ISO timestamp strings
 */
function nextRuns(cronExpr, options = {}) {
  const count = options.count || 5;
  
  // Validate the expression first
  if (!cron.validate(cronExpr)) {
    throw new Error(`Invalid cron expression: ${cronExpr}`);
  }
  
  // Note: node-cron doesn't provide next execution calculation
  // For a production version, we'd need cron-parser or similar
  // For now, return a helpful message
  return [`[nextRuns requires cron-parser - feature coming soon]`];
}

/**
 * Validate a cron expression
 * @param {string} cronExpr - Cron expression to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validate(cronExpr) {
  const isValid = cron.validate(cronExpr);
  if (isValid) {
    return { valid: true };
  } else {
    return { valid: false, error: 'Invalid cron syntax' };
  }
}

module.exports = {
  toHuman,
  toCron,
  nextRuns,
  validate,
};
