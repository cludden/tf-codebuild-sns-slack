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
  const url = config.get('slack.webhookUrl');
  /**
   * Build slack message using codebuild event payload
   * @param  {Object}      e - codebuild event payload
   * @return {String|Null}
   */
  function buildMessage(e) {
    const project = get(e, 'detail.project-name');
    const type = get(e, 'detail-type');
    const version = get(e, 'detail.additional-information.source-version');
    if (type === 'CodeBuild Build State Change') {
      const status = get(e, 'detail.build-status');
      if (status === 'IN_PROGRESS') {
        return `Build for project \`${project}:${version}\` is in progress...`;
      }
      return `Build for project \`${project}:${version}\` has \`${status.toLowerCase()}\`.`;
    } else if (type === 'CodeBuild Build Phase Change') {
      const phase = get(e, 'detail.completed-phase');
      const status = get(e, 'detail.completed-phase-status');
      const duration = get(e, 'detail.completed-phase-duration-seconds');
      return `Build for project \`${project}:${version}\` has completed phase \`${phase}\` with status \`${status}\` after ${duration} second(s).`;
    }
    return null;
  }

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
        const { status, statusText, data } = await http.post(url, { text });
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
    buildMessage,
    sendMessages,
  };
}
