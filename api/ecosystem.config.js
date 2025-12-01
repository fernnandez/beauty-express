module.exports = {
  apps: [
    {
      name: 'beauty-express',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
    },
  ],
};
