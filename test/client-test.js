'use strict';

/* eslint-env mocha, browser */

const sinon = require('sinon'); // eslint-disable-line

describe('client', () => {
  let s;
  let client;
  let processUpdate;

  beforeEach(() => {
    s = sinon.sandbox.create();
  });
  afterEach(() => {
    s.restore();
  });

  context('with default options', () => {
    beforeEach(() => {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      global.window = {
        EventSource: sinon.stub().returns({
          close: sinon.spy()
        })
      };
    });
    beforeEach(loadClient);
    it('should connect to __webpack_hmr', () => {
      sinon.assert.calledOnce(window.EventSource);
      sinon.assert.calledWithNew(window.EventSource);
      sinon.assert.calledWith(window.EventSource, '/__webpack_hmr');
    });
    it('should trigger webpack on successful builds', () => {
      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      }));
      sinon.assert.calledOnce(processUpdate);
    });
    it('should trigger webpack on successful syncs', () => {
      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        action: 'sync',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      }));
      sinon.assert.calledOnce(processUpdate);
    });
    it('should call subscribeAll handler on default messages', () => {
      const spy = sinon.spy();
      client.subscribeAll(spy);
      const message = {
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      };

      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage(message));

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, message);
    });
    it('should call subscribeAll handler on custom messages', () => {
      const spy = sinon.spy();
      client.subscribeAll(spy);

      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        action: 'thingy'
      }));

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { action: 'thingy' });
    });
    it('should call only custom handler on custom messages', () => {
      const spy = sinon.spy();
      client.subscribe(spy);

      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        custom: 'thingy'
      }));
      eventSource.onmessage(makeMessage({
        action: 'built'
      }));

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { custom: 'thingy' });
      sinon.assert.notCalled(processUpdate);
    });
    it("should test more of the client's functionality");
  });

  context('with name options', () => {
    beforeEach(() => {
      global.__resourceQuery = '?name=test'; // eslint-disable-line no-underscore-dangle
      global.window = {
        EventSource: sinon.stub().returns({
          close: sinon.spy()
        })
      };
    });
    beforeEach(loadClient);
    it('should not trigger webpack if event obj name is different', () => {
      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        name: 'foo',
        action: 'built',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      }));
      sinon.assert.notCalled(processUpdate);
    });
    it('should not trigger webpack on successful syncs if obj name is different', () => {
      const eventSource = window.EventSource.lastCall.returnValue;
      eventSource.onmessage(makeMessage({
        name: 'bar',
        action: 'sync',
        time: 100,
        hash: 'deadbeeffeddad',
        errors: [],
        warnings: [],
        modules: []
      }));
      sinon.assert.notCalled(processUpdate);
    });
  });

  context('with no browser environment', () => {
    beforeEach(() => {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      delete global.window;
    });
    beforeEach(loadClient);
    it('should not connect', () => {
      // doesn't error
    });
  });

  context('with no EventSource', () => {
    beforeEach(() => {
      global.__resourceQuery = ''; // eslint-disable-line no-underscore-dangle
      global.window = {};
      s.stub(console, 'warn');
    });
    beforeEach(loadClient);
    it('should emit warning and not connect', () => {
      sinon.assert.calledOnce(console.warn); // eslint-disable-line
      sinon.assert.calledWithMatch(console.warn, /EventSource/); // eslint-disable-line
    });
  });

  function makeMessage(obj) {
    return { data: typeof obj === 'string' ? obj : JSON.stringify(obj) };
  }

  function loadClient() {
    const path = require.resolve('../client');
    delete require.cache[path];
    client = require(path); // eslint-disable-line
  }

  beforeEach(() => {
    processUpdate = sinon.stub();
    require.cache[require.resolve('../process-update')] = {
      exports: processUpdate
    };
  });
  afterEach(() => {
    delete require.cache[require.resolve('../process-update')];
  });
});
