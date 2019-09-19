'use strict';

const { makeExecutableSchema } = require('graphql-tools');
const { ApolloServer } = require('apollo-server');
const fs = require('fs');
const path = require('path');
const resolvers = require('./resolvers')

const service = {
  name: 'graphql-gateway',
  created() {
    this.logger.info('creating graphql schema');

    const schema = makeExecutableSchema({
      typeDefs: fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8'),
      resolvers
    });

    this.server = new ApolloServer({
      schema,
      context: async (request) => {
        return { 
          service: this, 
          request 
        };
      }
    });
  },
  async started() {
    const { url } = await this.server.listen();
    this.logger.info(`graphql server ready at ${url}`);
  },
  async stopped() {
    await this.server.stop();
    this.logger.info(`graphql server stopped`);
  }
};

module.exports = service;