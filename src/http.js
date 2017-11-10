/**
 * @module http
 * @overview github http client
 */
import axios from 'axios';

export const inject = {
  name: 'http',
  require: ['config'],
};

export default function (config) {
  const client = axios.create({
    baseURL: config.get('slack.webhookUrl'),
    timeout: 1000,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${config.get('github.token')}`,
      'Content-Type': 'application/json',
    },
  });

  return client;
}
