"use strict";

const getChannelURL = require("ember-source-channel-url");

module.exports = async function () {
  return {
    useYarn: true,
    scenarios: [
      {
        name: "ember-lts-2.18",
        npm: {
          devDependencies: {
            "ember-source": "~2.18.0",
          },
        },
      },
      {
        name: "ember-lts-3.12",
        npm: {
          devDependencies: {
            "ember-source": "~3.12.0",
            "ember-native-dom-event-dispatcher": null,
          },
        },
      },
      {
        name: "ember-lts-3.16",
        npm: {
          devDependencies: {
            "ember-source": "~3.12.0",
            "ember-native-dom-event-dispatcher": null,
          },
        },
      },
      {
        name: "ember-lts-3.28",
        npm: {
          devDependencies: {
            "ember-source": "~3.12.0",
            "ember-native-dom-event-dispatcher": null,
          },
        },
      },
      {
        name: "ember-canary",
        allowedToFail: true,
        npm: {
          devDependencies: {
            "ember-source": await getChannelURL("canary"),
            "ember-native-dom-event-dispatcher": null,
            "ember-auto-import": "~2.4.1",
          },
          ember: {
            edition: "octane",
          },
        },
      },
      {
        name: "ember-beta",
        npm: {
          devDependencies: {
            "ember-source": await getChannelURL("beta"),
            "ember-native-dom-event-dispatcher": null,
            "ember-auto-import": "~2.4.1",
          },
          ember: {
            edition: "octane",
          },
        },
      },
      {
        name: "ember-release",
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            "application-template-wrapper": false,
            "template-only-glimmer-components": true,
          }),
        },
        npm: {
          devDependencies: {
            "ember-source": await getChannelURL("release"),
            "@ember/optional-features": "~2.0.0",
            "ember-native-dom-event-dispatcher": null,
            "ember-auto-import": "~2.4.1",
            webpack: "~5.72.1",
          },
          ember: {
            edition: "octane",
          },
        },
      },
    ],
  };
};
