#!/usr/bin/env node
const program = require('commander');
const migrator = require('./index.js');
const { join } = require('path');
const packageConfig = require('./package.json');

function loadConfig(location) {
  if (process && typeof location !== 'object') {
    return require(join(process.cwd(), location));
  }
  return location;
}

program
  .version(packageConfig.version)
  .option('-c, --config <config>', 'Configuration file, default ./seeds.json', loadConfig, null)
  .option('-R, --rollback', 'Rollback migrations')
  .arguments('[datasources...]')
  .parse(process.argv);

if (!program.config) {
  program.config = require(join(process.cwd(), 'migrations.json'));
}

module.exports = migrator(program, process.cwd())
  .then(() => process.exit(0))
  .catch((error) => { throw error; });
