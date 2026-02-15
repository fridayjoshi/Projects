const { toHuman, toCron, nextRuns, validate } = require('./index');

console.log('=== cron-human tests ===\n');

// Test toHuman
console.log('📖 Cron → Human:');
console.log('  0 9 * * 1-5     →', toHuman('0 9 * * 1-5'));
console.log('  0 15 * * 1      →', toHuman('0 15 * * 1'));
console.log('  */5 * * * *     →', toHuman('*/5 * * * *'));
console.log('  0 0 1 * *       →', toHuman('0 0 1 * *'));
console.log('  0 */4 * * *     →', toHuman('0 */4 * * *'));
console.log();

// Test toCron
console.log('✍️  Human → Cron:');
console.log('  "every monday at 3pm"        →', toCron('every monday at 3pm'));
console.log('  "every weekday at 9am"       →', toCron('every weekday at 9am'));
console.log('  "every day at 6pm"           →', toCron('every day at 6pm'));
console.log('  "every 15 minutes"           →', toCron('every 15 minutes'));
console.log('  "every 4 hours"              →', toCron('every 4 hours'));
console.log('  "every morning at 8am"       →', toCron('every morning at 8am'));
console.log('  "first day of every month at 9am" →', toCron('first day of every month at 9am'));
console.log();

// Test nextRuns
console.log('⏱️  Next runs (every weekday at 9am, Asia/Kolkata):');
const runs = nextRuns('0 9 * * 1-5', { count: 3, tz: 'Asia/Kolkata' });
runs.forEach((run, i) => {
  console.log(`  ${i + 1}. ${run}`);
});
console.log();

// Test validate
console.log('✅ Validation:');
console.log('  "0 9 * * 1-5" →', validate('0 9 * * 1-5'));
console.log('  "0 99 * * *"  →', validate('0 99 * * *'));
console.log();

// Round-trip test
console.log('🔄 Round-trip:');
const humanInput = 'every monday at 3pm';
const cronExpr = toCron(humanInput);
const humanOutput = toHuman(cronExpr);
console.log(`  Input:  "${humanInput}"`);
console.log(`  Cron:   ${cronExpr}`);
console.log(`  Output: "${humanOutput}"`);
