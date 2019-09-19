'use strict';

const resolvers = {
  Query: {
    async author(_, { id }, { service }) {
      try {
        return service.broker.call('author.query', { id });
      }
      catch (error) {
        const clean = error;
        delete clean.ctx;
        throw clean;
      }
    }
  },
  Mutation: {
    async author(_, { name }, { service }) {
      try {
        return await service.broker.call('author.mutate', { name });
      }
      catch (error) {
        const clean = error;
        delete clean.ctx;
        throw clean;
      }
    }
  }
};

module.exports = resolvers;