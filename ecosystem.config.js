module.exports = {
  apps : [{
    name   : "server",
    script : "./server.js",
    instances: "-1",
    exec_mode: "cluster",
    max_memory_restart: '500M',
    kill_timeout : 3000,
    wait_ready: true,
    listen_timeout: 10000,
    shutdown_with_message: true,
    env_production: {
      NODE_ENV: "production"
   },
   env_development: {
      NODE_ENV: "development"
   }
  }]
};
