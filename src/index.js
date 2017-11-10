/**
 * @file index.js
 * @overview lambda function entrypoint
 */
import 'source-map-support/register';
import container from './container';

export const ERROR = 'event:error';
export const NOOP = 'event:noop';
export const SUCCESS = 'event:success';

/**
 * Lambda function handler invoked by the lambda runtime
 * @param  {Object}   e    - lambda event
 * @param  {Object}   ctx  - lambda context object
 * @param  {Function} done - lambda callback
 * @return {Promise}
 */
export async function handler(e, ctx, done) {
  // freeze the node process immediately on exit
  // see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-using-old-runtime.html
  ctx.callbackWaitsForEmptyEventLoop = false;
  // load modules
  const modules = await container.load({
    config: 'config',
    slack: 'slack',
    sns: 'sns',
    log: 'log',
  });
  const log = modules.log.child({ req_id: ctx.awsRequestId });
  try {
    const result = await processEvent(e, { ...modules, log });
    log.info({ result }, SUCCESS);
    done(null, SUCCESS);
  } catch (err) {
    log.error(err, ERROR);
    done(err);
  }
}

/**
 * Extract, parse, and validate github event payloads and start builds for those
 * repositories that have a corresponding codebuild project.
 * @param  {Object}  e                 - lambda event
 * @param  {Object}  modules           - modules
 * @param  {Object}  modules.codebuild - codebuild implementation
 * @param  {Object}  modules.log       - logger implementation
 * @return {Promise}
 */
export async function processEvent(e, { log, slack, sns }) {
  const messages = await sns.extractMessages(e, { log });
  log.debug({ messages }, 'messages');
  if (!messages.length) {
    return NOOP;
  }
  const result = await slack.sendMessages(messages, { log });
  log.debug({ result }, SUCCESS);
  return SUCCESS;
}
