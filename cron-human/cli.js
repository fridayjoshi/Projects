#!/usr/bin/env node

const { toHuman, toCron, validate } = require('./index');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
cron-human - Bidirectional cron ↔ human translator

Usage:
  cron-human explain <cron-expression>
  cron-human create <natural-language>
  cron-human validate <cron-expression>

Examples:
  cron-human explain "0 9 * * 1-5"
  cron-human create "every monday at 3pm"
  cron-human validate "0 */4 * * *"
  `);
  process.exit(0);
}

const command = args[0];
const input = args.slice(1).join(' ');

try {
  switch (command) {
    case 'explain':
    case 'e':
      if (!input) {
        console.error('❌ Please provide a cron expression');
        process.exit(1);
      }
      console.log(toHuman(input));
      break;
      
    case 'create':
    case 'c':
      if (!input) {
        console.error('❌ Please provide a natural language description');
        process.exit(1);
      }
      console.log(toCron(input));
      break;
      
    case 'validate':
    case 'v':
      if (!input) {
        console.error('❌ Please provide a cron expression');
        process.exit(1);
      }
      const result = validate(input);
      if (result.valid) {
        console.log('✅ Valid cron expression');
        console.log(`📝 Meaning: ${toHuman(input)}`);
      } else {
        console.log(`❌ Invalid: ${result.error}`);
        process.exit(1);
      }
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Use: explain, create, or validate');
      process.exit(1);
  }
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
