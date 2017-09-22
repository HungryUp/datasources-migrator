const { promisify } = require('util');
const fs = require('fs');
const { join } = require('path');

const readdir = promisify(fs.readdir);

module.exports = async ({ config = {}, args = [], rollback }, workingDir) => {
  const sources = (args.length > 0 ? args : Object.keys(config.sources || {}))
    .reduce((obj, key) => {
      obj[key] = config.sources[key] || {};
      return obj;
    }, {});


  const sourceNames = Object.keys(sources);
  const migratoring = [];
  for (const sourceName of sourceNames) {
    migratoring.push((async () => {
      const source = Object.assign({ rollback }, sources[sourceName]);
      const files = await readdir(join(workingDir, source.path));
      const driverPath = join(workingDir, 'node_modules', source.driver);
      const driver = require(driverPath);
      const { play, init, end } = driver(source, workingDir);
      const db = await init();
      await play(db, files);
      await end(db);
    })());
  }

  return Promise
    .all(migratoring);
};
