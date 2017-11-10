import MockAdapter from 'axios-mock-adapter';
import { fromCallback } from 'bluebird';
import { expect } from 'chai';
import { before, afterEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { handler, SUCCESS } from '../../src';
import container from '../../src/container';
import * as sns from '../fixtures/sns';
import phaseChange from '../fixtures/build-phase-change.json';
import stateChange from '../fixtures/build-state-change.json';

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
    const e = sns.event(
      // invalid topic arn
      sns.record('hello world', { topicArn: 'test' }),
      // non json
      sns.record('{ hello world }', { topicArn: this.config.get('sns.topic_arn') }),
      // missing detail-type attribute
      sns.record('{"foo":"bar"}', { topicArn: this.config.get('sns.topic_arn') }),
    );
    const spy = this.sandbox.spy(this.slack, 'sendMessages');
    const result = await fromCallback(done => handler(e, {}, done));
    expect(result).to.equal(SUCCESS);
    expect(spy.callCount).to.equal(0);
  });

  it('should send a message to slack (phase)', async function () {
    let config;
    this.mock.onPost(/.+/g).reply((c) => {
      config = c;
      return [200, 'OK'];
    });
    const e = sns.event(sns.record(JSON.stringify(phaseChange), { topicArn: this.config.get('sns.topic_arn') }));
    const result = await fromCallback(done => handler(e, {}, done));
    expect(result).to.equal(SUCCESS);
    expect(config).to.have.nested.property('url', this.config.get('slack.webhookUrl'));
    expect(config).to.have.nested.property('headers.Content-Type', 'application/json');
    const body = JSON.parse(config.data);
    expect(body).to.have.property('text', 'Build for project `my-repo/pr/6` has completed phase `PROVISIONING` with status `SUCCEEDED` after 21 second(s).');
  });

  it('should send a message to slack (state)', async function () {
    let config;
    this.mock.onPost(/.+/g).reply((c) => {
      config = c;
      return [200, 'OK'];
    });
    const e = sns.event(sns.record(JSON.stringify(stateChange), { topicArn: this.config.get('sns.topic_arn') }));
    const result = await fromCallback(done => handler(e, {}, done));
    expect(result).to.equal(SUCCESS);
    expect(config).to.have.nested.property('url', this.config.get('slack.webhookUrl'));
    expect(config).to.have.nested.property('headers.Content-Type', 'application/json');
    const body = JSON.parse(config.data);
    expect(body).to.have.property('text', 'Build for project `my-repo/pr/6` has `succeeded`.');
  });
});
