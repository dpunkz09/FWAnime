module.exports = {
  apps: [
    {
      name: "Anime",
      cwd: "/var/www/flixworld.xyz/FWAnime",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 2222,
      },
      time: true,
    },
  ],
};
