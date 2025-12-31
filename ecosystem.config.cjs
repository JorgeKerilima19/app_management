// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "RestMana-Server", // Name for PM2
      script: "pnpm", // The command to run
      args: "start", // Arguments for the script (equivalent to 'pnpm start')
      cwd: ".", // Current working directory (relative to where the script runs)
      instances: 1, // Number of instances (usually 1 for a single app)
      autorestart: true, // Restart if the app crashes
      watch: false, // Watch for changes (false for production builds)
      env: {
        NODE_ENV: "production",
        PORT: 3000, // Your desired port
        // Add other environment variables here if needed (e.g., DATABASE_URL)
        // DATABASE_URL: "postgresql://...",
      },
      // Optional: Log files
      out_file: "./logs/app-out.log",
      error_file: "./logs/app-error.log",
      log_file: "./logs/app-combined.log",
      time: true, // Add timestamps to logs
    },
  ],
};