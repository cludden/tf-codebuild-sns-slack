/**
 * @module slack
 * @overview implements functionality related to sending messages to slack
 */
import { mapSeries } from 'bluebird';
import get from 'lodash.get';

export const inject = {
  name: 'slack',
  require: ['config', 'http'],
};

export default function (config, http) {
  /**
   * Send messages to slack via incoming webhook
   * @param  {String[]} messages - list of one or more messages to send to slack
   * @param  {Object}   ctx      - context
   * @param  {Object}   ctx.log  - logger
   * @return {Promise}
   */
  async function sendMessages(messages, { log }) {
    return mapSeries(messages, async (text) => {
      try {
        const { status, statusText, data } = await http.post('/', { text });
        return { status, statusText, data };
      } catch (err) {
        const data = get(err, 'response.data');
        const status = get(err, 'response.status');
        const method = get(err, 'config.method', 'UNKNOWN');
        const payload = get(err, 'config.data');
        const msg = `${method} failed with status (${status}) and data: ${JSON.stringify(data)}`;
        log.error({ data: payload }, msg);
        throw err;
      }
    });
  }

  return {
    sendMessages,
  };
}
