
const { ServiceBroker } = require('moleculer');
const { createTable, consume, connect } = require('./kstream');
const { connectProducer } = require('./producer');
const CUID = require('cuid');

const wait = function (t) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
};

const seed = function () {
  return connectProducer({ 'metadata.broker.list': 'kafka:9092' }).then(
    (producer) => {
      return new Promise((resolve) => {
        const author = { id: CUID(), name: 'J.R.R Tolkien' };

        console.log(author);
        
        producer.produce('author-topic', null, new Buffer(JSON.stringify(author)));

        producer.flush(500, () => {
          console.log('Producer flushed');
          producer.disconnect();
          resolve();
        });
      });
    }
  );
};

const initTable = async function () {
  await wait(15000);

  await seed();

  const table = createTable('author-topic', {
    noptions: {
      'metadata.broker.list': 'kafka:9092',
      'group.id': 'graphql-kappa-' + Date.now(),
      'event_cb': true
    },
    tconf: {
      'auto.offset.reset': 'earliest'
    }
  });

  await consume(table, 1);

  return table;
};

initTable().then((table) => {
  const broker = new ServiceBroker({
    nodeID: 'node-author',
    transporter: 'nats://nats-server:4222',
    logLevel: 'info',
    cacher: 'memory'
  });

  broker.createService({
    name: 'author',
    actions: {
      query({ params }) {
        return table.storage.get(params.id);
      },
      mutate({ params }) {
        return table.storage.set({ id: CUID(), name: params.name });
      }
    }
  });

  console.log('STARTING BROKER');

  broker.start();
}).catch((error) => {
  console.error(error.stack);
});