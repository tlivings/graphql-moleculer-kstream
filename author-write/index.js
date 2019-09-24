
const { ServiceBroker } = require('moleculer');
const { Producer } = require('node-rdkafka');
const cuid = require('cuid');

const broker = new ServiceBroker({
  nodeID: 'author-write',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService({
  name: 'author',
  methods: {
    wait(time) {
      return new Promise((resolve) => {
        this.logger.info('artificial wait for kafka to be ready');
        setTimeout(resolve, time);
      });
    },
    connect(options) {
      return new Promise((resolve, reject) => {
        this.producer.on('connection.failure', () => {
          this.logger.error('producer connection failure');
          reject(new Error('connection error'));
        });
    
        this.producer.on('ready', (info) => {
          this.logger.info('producer ready');
          resolve();
        });
    
        this.logger.info('producer connecting');

        this.producer.connect(options);
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
    }
  },
  created() {
    this.producer = new Producer({ 
      'client.id': 'author-write-' + cuid(),
      'metadata.broker.list': 'kafka:9092',
      'socket.keepalive.enable': true
    });

    this.producer.on('disconnected', () => {
      this.logger.info('producer disconnected');
    });

    this.producer.on('error', (error) => {
      this.logger.error(`producer error: ${error.message}`);
    });

    this.producer.on('event.error', (error) => {
      this.logger.error(`producer error: ${error.message}`);
    });
  },
  async started() {  
    await this.wait(10000);
    await this.connect();
  },
  async stopped() {
    await this.producer.disconnect();
  },
  actions: {
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