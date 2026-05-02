const { execSync } = require('child_process');

try {
  console.log('Running prisma db push...');
  const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' });
  console.log('OUTPUT:', output);
} catch (error) {
  console.error('ERROR:', error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.error('STDERR:', error.stderr);
}
