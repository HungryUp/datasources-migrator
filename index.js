#!/usr/bin/env node
const program = require('commander');
const { promisify } = require('util');
const fs = require('fs');
const { join } = require('path');
const packageConfig = require('./package.json');
const readdir = promisify(fs.readdir);

function loadConfig(location) {
  if (process && typeof location !== "object") {
    return require(join(process.cwd(), location));
  }
  return location;
}

program
  .version(packageConfig.version)
  .option('-c, --config <config>', 'Configuration file, default ./seeds.json', loadConfig, null)
  .option('-R, --rollback', 'Rollback migrations')
  .arguments('[datasources...]')
  .parse(process.argv)

if (!program.config) {
  program.config = require(join(process.cwd(), 'migrations.json'));
}

const { config, args, rollback } = program;
const sources = (args.length > 0 ? args : Object.keys(config.sources))
  .reduce((obj, key) => {
    obj[key] = config.sources[key] || {};
    return obj;
  }, {});


const sourceNames = Object.keys(sources);
const migratoring = [];
for (const sourceName of sourceNames) {
  migratoring.push((async () => {
    const source =  Object.assign({ rollback }, sources[sourceName]);
    const files = await readdir(join(process.cwd(), source.path));
    const { play, init, end } = require(join(process.cwd(), 'node_modules', source.driver));
    const db = await init(source);
    await play(db, source, files);
    await end(db, source);
  })());
}

Promise
  .all(migratoring)
  .then(r => process.exit(0))
  .catch(error => { throw error });

