// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "RestMana-Dev", // Name for development
      script: "pnpm",
      args: "dev", // Run in development mode
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development", // Explicitly set dev mode
        PORT: 3000,
      },
      out_file: "./logs/app-dev-out.log",
      error_file: "./logs/app-dev-error.log",
      log_file: "./logs/app-dev-combined.log",
      time: true,
    },
  ],
};
