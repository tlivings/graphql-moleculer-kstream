
const { ServiceBroker } = require('moleculer');
const path = require('path');

const broker = new ServiceBroker({
  nodeID: 'node-gateway',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.loadService(path.join(__dirname, './services/gateway.js'));

broker.start();