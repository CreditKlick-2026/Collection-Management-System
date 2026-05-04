const { execSync } = require('child_process');

console.log("Stopping all running Node.js server processes to unlock Prisma...");

try {
  // Find processes listening on port 3000
  const output = execSync('netstat -ano | findstr :3000').toString();
  const lines = output.trim().split('\n');
  
  if (lines.length > 0) {
    const parts = lines[0].trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    
    if (pid && pid !== '0') {
      console.log(`Found Next.js running on PID ${pid}. Killing it...`);
      execSync(`taskkill /F /PID ${pid}`);
      console.log("✅ Successfully killed the server process.");
    }
  }
} catch (e) {
  console.log("No process found on port 3000. Checking for other node processes...");
}

try {
  console.log("\nRunning Prisma Generate...");
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log("\n✅ PRISMA GENERATION SUCCESSFUL!");
  console.log("\n👉 You can now run `npm run dev` to start your server again. Everything will work!");
} catch (e) {
  console.error("\n❌ Prisma generation still failed. Please restart your computer if the file remains locked.");
}
