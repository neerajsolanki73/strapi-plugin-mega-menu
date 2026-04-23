'use strict';

const controllers = require('./controllers');
const contentTypes = require('./content-types');
const routeBundle = require('./routes');
const services = require('./services');
const CUSTOM_FIELD_NAME = 'mega-menu-builder';

module.exports = {
  register({ strapi }) {
    strapi.customFields.register({
      name: CUSTOM_FIELD_NAME,
      plugin: 'mega-menu',
      type: 'json',
      inputSize: {
        default: 12,
        isResizable: true,
      },
    });
  },

  bootstrap(/* { strapi } */) {},

  controllers,
  services,
  contentTypes,
  routes: routeBundle.routes,
};
