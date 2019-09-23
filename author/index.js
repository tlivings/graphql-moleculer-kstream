
const { ServiceBroker } = require('moleculer');
const { connectProducer } = require('./producer');
const { KafkaStreams } = require('kafka-streams');
const cuid = require('cuid');

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
    produce(message) {
      const payload = JSON.stringify(message);

      return new Promise((resolve) => {
        this.producer.produce('author-topic', null, new Buffer(payload));

        this.logger.info(`produced ${payload}`);

        this.producer.flush(500, () => {
          this.logger.info('producer flushed');
          resolve();
        });
      });
    },
    async seed() {
      this.logger.info('seeding ktable');

      return this.produce({ id: cuid(), name: 'J.R.R Tolkien' });
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
    this.logger.info('starting ktable');  

    await this.table.start();

    this.logger.info('started');

    this.logger.info('connecting producer');

    this.producer = await connectProducer({ 'metadata.broker.list': 'kafka:9092' });

    await this.seed();
  },
  async stopped() {
    await this.producer.disconnect();
  },
  actions: {
    query({ params }) {
      this.logger.info(`${this.name}.query id=${params.id}`);
      return this.table.storage.get(params.id);
    },
    async mutation({ params }) {
      this.logger.info(`${this.name}.mutation name=${params.name}`);

      const id = cuid();

      await this.produce({ id, name: params.name });

      return {
        id
      };
    }
  }
});

broker.start();