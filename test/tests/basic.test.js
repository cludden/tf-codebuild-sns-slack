import MockAdapter from 'axios-mock-adapter';
import { fromCallback } from 'bluebird';
import { expect } from 'chai';
import { before, afterEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { handler, SUCCESS } from '../../src';
import container from '../../src/container';
import * as sns from '../fixtures/sns';

describe('basic', function () {
  before(async function () {
    const modules = await container.load({
      slack: 'slack',
      http: 'http',
      config: 'config',
    });
    Object.assign(this, modules);
    this.sandbox = sinon.sandbox.create();
    this.mock = new MockAdapter(this.http);
  });

  afterEach(function () {
    this.sandbox.restore();
    this.mock.reset();
  });

  it('should skip invalid messages', async function () {
    const e = sns.event(sns.record('hello world', { topicArn: 'test' }));
    const spy = this.sandbox.spy(this.slack, 'sendMessages');
    const result = await fromCallback(done => handler(e, {}, done));
    expect(result).to.equal(SUCCESS);
    expect(spy.callCount).to.equal(0);
  });

  it('should send a message to slack', async function () {
    let config;
    this.mock.onPost(/.+/g).reply((c) => {
      config = c;
      return [200, 'OK'];
    });
    const e = sns.event(sns.record('THIS IS MY MESSAGE!', { topicArn: this.config.get('sns.topic_arn') }));
    const result = await fromCallback(done => handler(e, {}, done));
    expect(result).to.equal(SUCCESS);
    expect(config).to.have.nested.property('baseURL', this.config.get('slack.webhookUrl'));
    expect(config).to.have.nested.property('headers.Content-Type', 'application/json');
    expect(config).to.have.nested.property('url', '/');
    const body = JSON.parse(config.data);
    expect(body).to.have.property('text', 'THIS IS MY MESSAGE!');
  });
});
