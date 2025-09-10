module.exports = {
  apps: [
    {
      name: 'deathroll-wow',
      script: './server/server.js',
      cwd: '/var/www/deathroll-wow',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3005
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3040
      },
      // PM2 specific settings
      watch: false, // Set to true if you want PM2 to restart on file changes
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Auto restart settings
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment variables for production
      env_vars: {
        'CORS_ORIGIN': 'https://deathroll.xyz' // Update with your actual domain
      }
    }
  ]
};
