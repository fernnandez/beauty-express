module.exports = {
  apps: [
    {
      name: 'beauty-express-api',
      script: './dist/main.js',
      cwd: __dirname,
      instances: 1, // ou 'max' para usar todos os CPUs
      exec_mode: 'fork', // 'fork' para single instance, 'cluster' para múltiplas
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        CORS_ORIGIN: 'http://localhost:5173',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
