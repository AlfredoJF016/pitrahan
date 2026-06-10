module.exports = {
  apps: [
    {
      name: 'pitrahan-backend',
      script: 'server.js',
      instances: 'max', // Scales app across all available VPS CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M', // Automatically restarts if memory leak crosses limit
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
