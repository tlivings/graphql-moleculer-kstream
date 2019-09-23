'use strict';

const resolvers = {
  Query: {
    async author(_, { id }, { service }) {
      try {
        service.logger.info(`invoking author.query`);
        return service.broker.call('author.query', { id });
      }
      catch (error) {
        service.logger.error(`error: ${error.message}`);
        const clean = error;
        delete clean.ctx;
        throw clean;
      }
    }
  },
  Mutation: {
    async author(_, { name }, { service }) {
      try {
        service.logger.info(`invoking author.mutation`);
        return await service.broker.call('author.mutation', { name });
      }
      catch (error) {
        service.logger.error(`error: ${error.message}`);
        const clean = error;
        delete clean.ctx;
        throw clean;
      }
    }
  }
};

module.exports = resolvers;