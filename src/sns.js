/**
 * @module sns
 * @overview implements functionality related to parsing codebuild events from sns
 */
import attempt from 'lodash.attempt';
import get from 'lodash.get';

export const inject = {
  name: 'sns',
  require: ['config'],
};

export default function (config) {
  const eventSourceARN = config.get('sns.topic_arn');

  /**
   * Extract codebuild events from lambda event
   * @param  {Object}   e           - lambda event
   * @param  {Object}   options     - options
   * @param  {Object}   options.log - logger
   * @return {Object}
   */
  function extractEvents(e, { log }) {
    return get(e, 'Records', [])
      .reduce((acc, record) => {
        // filter out records that did not originate from the our target input stream
        if (record.EventSource !== 'aws:sns' || record.Sns.TopicArn !== eventSourceARN) {
          log.warn({ record: JSON.stringify(record) }, 'invalid event source');
          return acc;
        }

        const parsed = attempt(() => JSON.parse(record.Sns.Message));
        if (parsed instanceof Error) {
          log.warn({ record: JSON.stringify(record) }, 'validation error');
          return acc;
        }

        acc.push(parsed);
        return acc;
      }, []);
  }

  return {
    extractEvents,
  };
}
