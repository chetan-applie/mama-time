module.exports = {
  apps: [{
    name: 'mama-time',
    script: 'backend/src/server.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '350M',
    time: true,
    env: {
      NODE_ENV: 'production',
      RUN_MIGRATIONS_ON_START: 'false'
    }
  }]
};
