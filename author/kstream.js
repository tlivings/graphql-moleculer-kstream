
const { KafkaStreams } = require('kafka-streams');

const consume = async function (table, count) {
  console.log('CONSUMING KTABLE');

  table.consumeUntilCount(count, () => {
    console.log('TOPIC CONSUMED');
  });

  console.log('STARTING KTABLE');

  await table.start();

  return table;
};

const createTable = function (topic, config) {
  const kafkaStreams = new KafkaStreams(config);

  const keyMap = function (message) {
    const value = JSON.parse(message.value);
    return { key: value.id, value };
  };

  return kafkaStreams.getKTable(topic, keyMap);
};

module.exports = { createTable, consume };