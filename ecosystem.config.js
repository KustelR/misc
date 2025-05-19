module.exports = {
  apps: [
    {
      name: 'misc website',
      script: 'npm run start',
      exec_mode: 'cluster',
      instances: 'max'
    }
  ]
}