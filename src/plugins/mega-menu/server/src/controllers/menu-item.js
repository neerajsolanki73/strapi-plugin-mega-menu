'use strict';

const serviceName = 'plugin::mega-menu.menu-item';

module.exports = {
  async find(ctx) {
    const items = await strapi.service(serviceName).find();
    ctx.body = { data: items };
  },

  async create(ctx) {
    const { title, url, parent, parentDocumentId } = ctx.request.body || {};

    if (!title || !url) {
      return ctx.badRequest('Missing title or url');
    }

    const item = await strapi.service(serviceName).create({
      title,
      url,
      parent: parent ?? parentDocumentId ?? null,
    });

    ctx.body = { data: item };
  },

  async update(ctx) {
    const id = ctx.params.id || ctx.params.documentId;

    if (!id) {
      return ctx.badRequest('Missing item id');
    }

    const { title, url, parent, parentDocumentId } = ctx.request.body || {};

    const item = await strapi.service(serviceName).update(id, {
      title,
      url,
      parent: parent ?? parentDocumentId,
    });

    ctx.body = { data: item };
  },

  async delete(ctx) {
    const id = ctx.params.id || ctx.params.documentId;

    if (!id) {
      return ctx.badRequest('Missing item id');
    }

    await strapi.service(serviceName).delete(id);

    ctx.body = { data: null };
  },
};
