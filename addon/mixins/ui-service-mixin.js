/* eslint-disable ember/no-new-mixins */
import {cancel, later, run} from '@ember/runloop';
import {Promise as EmberPromise} from 'rsvp';
import Mixin from '@ember/object/mixin';
import {on} from '@ember/object/evented';
import UUIDGenerator from 'torii/lib/uuid-generator';
import PopupIdSerializer from 'torii/lib/popup-id-serializer';
import ParseQueryString from 'torii/lib/parse-query-string';
import assert from 'torii/lib/assert';
import {getConfiguration} from 'torii/configuration';

export const CURRENT_REQUEST_KEY = '__torii_request';
export const WARNING_KEY = '__torii_redirect_warning';

function parseMessage(url, keys) {
  const parser = ParseQueryString.create({ url: url, keys: keys });
  return parser.parse();
}

let ServicesMixin = Mixin.create({
  init() {
    this._super(...arguments);
    this.remoteIdGenerator = this.remoteIdGenerator || UUIDGenerator;
  },

  // Open a remote window. Returns a promise that resolves or rejects
  // according to whether the window is redirected with arguments in the URL.
  //
  // For example, an OAuth2 request:
  //
  // popup.open('http://some-oauth.com', ['code']).then(function(data){
  //   // resolves with data.code, as from http://app.com?code=13124
  // });
  //
  // Services that use this mixin should implement openRemote
  //
  open(url, keys, options) {
    let service = this;
    let lastRemote = this.remote;
    let postMessageToriiEventHandler;

    return new EmberPromise(function (resolve, reject) {
      if (lastRemote) {
        service.close();
      }

      const remoteId = service.remoteIdGenerator.generate();

      postMessageToriiEventHandler = function (event) {
        if (event.origin !== window.location.origin) {
          console.log("Event received is not from ORIGIN!")
          return;
        }
        if (event.source !== service.remote) {
          console.log("Event received is not from REMOTE!")
          return;
        }
        const remoteIdFromEvent = event.data.remoteId;
        if (remoteId === remoteIdFromEvent) {
          const data = parseMessage(event.data.data, keys);
          run(function () {
            resolve(data);
          });
        }
      };

      service.openRemote(url, remoteId, options);
      service.schedulePolling();

      const onbeforeunload = window.onbeforeunload;
      window.onbeforeunload = function () {
        if (typeof onbeforeunload === 'function') {
          onbeforeunload();
        }
        service.close();
      };

      if (service.remote && !service.remote.closed) {
        service.remote.focus();
      } else {
        reject(new Error('remote could not open or was closed'));
        return;
      }

      service.one('didClose', function () {
        // If we don't receive a message before the timeout, we fail. Normally,
        // the message will be received and the window will close immediately.
        service.timeout = later(
          service,
          function () {
            reject(
              new Error(
                'remote was closed, authorization was denied, or an authentication message otherwise not received before the window closed.'
              )
            );
          },
          100
        );
      });
      window.addEventListener('message', postMessageToriiEventHandler);
    }).finally(function () {
      // didClose will reject this same promise, but it has already resolved.
      service.close();
      window.removeEventListener('message', postMessageToriiEventHandler);
    });
  },

  close() {
    if (this.remote) {
      this.closeRemote();
      this.remote = null;
      this.trigger('didClose');
    }
    this.cleanUp();
  },

  cleanUp() {
    this.clearTimeout();
  },

  schedulePolling() {
    this.polling = later(
      this,
      function () {
        this.pollRemote();
        this.schedulePolling();
      },
      35
    );
  },

  // Clear the timeout, in case it hasn't fired.
  clearTimeout() {
    cancel(this.timeout);
    this.timeout = null;
  },

  stopPolling: on('didClose', function () {
    cancel(this.polling);
  }),
});

export default ServicesMixin;
