
const { ServiceBroker } = require('moleculer');
const { KafkaStreams } = require('kafka-streams');
const cuid = require('cuid');

const broker = new ServiceBroker({
  nodeID: 'author-read',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService({
  name: 'author',
  created() {
    const kafkaStreams = new KafkaStreams({
      noptions: {
        'metadata.broker.list': 'kafka:9092',
        'group.id': 'author-read-' + cuid(),
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
  },
  async stopped() {
    await this.producer.disconnect();
  },
  actions: {
    query({ params }) {
      this.logger.info(`${this.name}.query id=${params.id}`);
      return this.table.storage.get(params.id);
    }
  }
});

broker.start();