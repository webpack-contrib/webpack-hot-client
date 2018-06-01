# WebSocket Documentation

## Communicating with Client WebSockets

In some rare situations, you may have the need to communicate with the attached
`WebSockets` in the browser. To accomplish this, open a new `WebSocket` to the
server, and send a `broadcast` message. eg.

```js
const stringify = require('json-stringify-safe');
const { WebSocket } = require('ws');

const socket = new WebSocket('ws://localhost:8081'); // this should match the server settings
const data = {
  type: 'broadcast',
  data: { // the message you want to broadcast
    type: '<something fun>', // the message type you want to broadcast
    data: { ... } // the message data you want to broadcast
  }
};

socket.send(stringify(data));
```

_Note: The `data` property of the message should contain the enveloped message
you wish to broadcast to all other client `WebSockets`._