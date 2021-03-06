const path = require('path');
const debug = require('debug')('feathers-generator:hook');

// Metalsmith + middleware
const Metalsmith = require('metalsmith');

const TEMPLATE_PATH = path.resolve(__dirname, 'templates');
const render = require('../utils/render');
const json = require('../utils/json');
const ask = require('../utils/ask');

import { filter as rename } from '../utils/rename';
import { filter as mount } from '../utils/mount';

module.exports = function (prompt, done, options) {
  const metalsmith = Metalsmith(TEMPLATE_PATH);
  const SERVICE_PATH = path.resolve(options.path);
  const FEATHERS_PATH = 'server/feathers.json';
  const MOUNT_PATH = options.mount || 'server/feathers.json';
  const CONFIG_PATH = options.config || 'config';

  // if generating as standalone, use src dir
  let FILTER_PATH;
  if (!options.mount && options.path === '.') {
    FILTER_PATH = path.resolve(SERVICE_PATH, 'src');
  } else {
    FILTER_PATH = path.resolve(SERVICE_PATH, 'filters');
  }

  debug('Template path: %s', TEMPLATE_PATH);
  debug('Service path: %s', SERVICE_PATH);
  debug('Filter path: %s', FILTER_PATH);
  debug('Feathers path: %s', FEATHERS_PATH);
  debug('Mount path: %s', MOUNT_PATH);
  debug('Config path: %s', CONFIG_PATH);

  metalsmith
    .metadata({ options })
    // Read in any existing config files and attach to metadata
    // TODO slajax or EK refactor option args into util fn so not duplicated
    .use(json({
      meta: path.resolve(__dirname, 'meta.json'),
      default: path.join(options.root, CONFIG_PATH, 'default.json'),
      staging: path.join(options.root, CONFIG_PATH, 'staging.json'),
      production: path.join(options.root, CONFIG_PATH, 'production.json'),
      feathers: path.join(options.root, FEATHERS_PATH),
      service: path.join(options.root, MOUNT_PATH),
      pkg: path.join(options.root, 'package.json')
    }))
    .clean(false)
    .source(TEMPLATE_PATH)
    .destination(FILTER_PATH)
    .use(ask({ callback: prompt }))
    .use(rename(options)) // rename files for convention
    .use(mount(options)) // mount filter for bootstrap
    .use(render()) // pass files through handlebars templating
    .build(function (error) {
      if (error) {
        return done(error);
      }

      let message = `Successfully generated "${options.name}" ${options.template} at ${FILTER_PATH}`;
      debug(message);
      done(null, message);
    });
};
