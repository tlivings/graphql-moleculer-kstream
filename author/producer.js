
const Kafka = require('node-rdkafka');

const connectProducer = function (config) {
  const producer = new Kafka.Producer(config);

  return new Promise((resolve, reject) => {

    producer.on('connection.failure', () => {
      console.log('ProducerConnection connection failure');
      reject(new Error('Connection Error'));
    });

    producer.on('ready', (info) => {
      console.log('ProducerConnection connected:', info);
      resolve(producer);
    });

    producer.on('disconnected', () => {
      console.log('ProducerConnection disconnected');
    });

    producer.on('error', (error) => {
      console.log(`ProducerConnection error: ${error.message}`);
      reject(error);
    });

    producer.on('event.error', (error) => {
      console.log(`ProducerConnection error: ${error.message}`);
      reject(error);
    });

    producer.connect({ timeout: 500 });

  });
};

module.exports = { connectProducer };