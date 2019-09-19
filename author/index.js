
const { ServiceBroker } = require('moleculer');
const { connectProducer } = require('./producer');
const { KafkaStreams } = require('kafka-streams');
const CUID = require('cuid');

const broker = new ServiceBroker({
  nodeID: 'node-author',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService({
  name: 'author',
  methods: {
    wait(t) {
      return new Promise((resolve) => {
        setTimeout(resolve, t);
      });
    },
    async seed() {
      this.logger.info('seeding ktable');

      await this.wait(15000);

      const producer = await connectProducer({ 'metadata.broker.list': 'kafka:9092' });

      const author = { id: CUID(), name: 'J.R.R Tolkien' };

      this.logger.info(`produced ${JSON.stringify(author)}`);
      
      return new Promise((resolve) => {
        producer.produce('author-topic', null, new Buffer(JSON.stringify(author)));

        producer.flush(500, () => {
          this.logger.info('producer flushed');
          producer.disconnect();
          resolve();
        });
      });
    },
    consume(count) {
      this.logger.info('consuming ktable');

      this.table.consumeUntilCount(count);
    }
  },
  created() {
    const kafkaStreams = new KafkaStreams({
      noptions: {
        'metadata.broker.list': 'kafka:9092',
        'group.id': 'graphql-kappa-' + Date.now(),
        'event_cb': true
      },
      tconf: {
        'auto.offset.reset': 'earliest'
      }
    });

    const keyMap = function (message) {
      const value = JSON.parse(message.value);
      return { key: value.id, value };
    };

    this.table = kafkaStreams.getKTable('author-topic', keyMap);
  },
  async started() {
    await this.seed();

    this.logger.info('starting ktable');

    await this.table.start();
    
    await this.consume(1);

    this.logger.info('started');
  },
  actions: {
    query({ params }) {
      return this.table.storage.get(params.id);
    },
    mutate({ params }) {
      return this.table.storage.set({ id: CUID(), name: params.name });
    }
  }
});

broker.start();