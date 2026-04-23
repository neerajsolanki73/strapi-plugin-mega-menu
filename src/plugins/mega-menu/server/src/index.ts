import controllers = require('./controllers');
import contentTypes = require('./content-types');
import routeBundle = require('./routes');
import services = require('./services');

const CUSTOM_FIELD_NAME = 'mega-menu-builder';

const server = {
  register({ strapi }: { strapi: any }) {
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

  bootstrap() {},

  controllers,
  services,
  contentTypes,
  routes: routeBundle.routes,
};

export = server;
