/**
 * @file container.js
 * @overview function di/ioc container
 */
import Container from 'app-container';

import * as config from './config';
import * as http from './http';
import * as log from './log';
import * as slack from './slack';
import * as sns from './sns';
import * as ssm from './ssm';

const modules = [
  config,
  http,
  log,
  slack,
  sns,
  ssm,
];

const container = new Container({
  defaults: { singleton: true },
});

modules.forEach(mod => container.register(mod, mod.inject.name, mod.inject));

export default container;
