import { before } from 'mocha';
import sinon from 'sinon';

import container from '../../src/container';

before(async function () {
  const ssm = await container.load('ssm');
  sinon.stub(ssm, 'getParameters').returns({
    promise: sinon.stub().resolves({
      Parameters: [{
        Value: JSON.stringify({
          slack: {
            webhookUrl: 'https://www.example.com',
          },
          log: {
            level: process.env.LOG_LEVEL,
          },
          sns: {
            topic_arn: 'xxxx',
          },
        }),
      }],
    }),
  });
});
