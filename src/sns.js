/**
 * @module sns
 * @overview implements functionality related to parsing codebuild events from sns
 */
import get from 'lodash.get';

export const inject = {
  name: 'sns',
  require: ['config'],
};

export default function (config) {
  const eventSourceARN = config.get('sns.topic_arn');

  /**
   * Extract codebuild event messages from lambda event
   * @param  {Object}   e           - lambda event
   * @param  {Object}   options     - options
   * @param  {Object}   options.log - logger
   * @return {Object}
   */
  function extractMessages(e, { log }) {
    return get(e, 'Records', [])
      .reduce((acc, record) => {
        // filter out records that did not originate from the our target input stream
        if (record.EventSource !== 'aws:sns' || record.Sns.TopicArn !== eventSourceARN) {
          log.warn({ record: JSON.stringify(record) }, 'invalid event source');
          return acc;
        }

        acc.push(record.Sns.Message);
        return acc;
      }, []);
  }

  return {
    extractMessages,
  };
}
