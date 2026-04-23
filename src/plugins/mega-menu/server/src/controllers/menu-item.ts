const serviceName = 'plugin::mega-menu.menu-item';

type StrapiContext = {
  request: { body?: Record<string, unknown> };
  params: { id?: string; documentId?: string };
  body?: unknown;
  badRequest: (message: string) => unknown;
};

declare const strapi: any;
const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const menuItemController = {
  async find(ctx: StrapiContext) {
    const items = await strapi.service(serviceName).find();
    ctx.body = { data: items };
  },

  async create(ctx: StrapiContext) {
    const { title, url, parent, parentDocumentId } = ctx.request.body || {};
    try {
      const item = await strapi.service(serviceName).create({
        title,
        url,
        parent: parent ?? parentDocumentId ?? null,
      });
      ctx.body = { data: item };
    } catch (error) {
      return ctx.badRequest(toErrorMessage(error, 'Could not create menu item'));
    }
  },

  async update(ctx: StrapiContext) {
    const id = ctx.params.id || ctx.params.documentId;

    if (!id) {
      return ctx.badRequest('Missing item id');
    }

    const { title, url, parent, parentDocumentId } = ctx.request.body || {};

    try {
      const item = await strapi.service(serviceName).update(id, {
        title,
        url,
        parent: parent ?? parentDocumentId,
      });
      ctx.body = { data: item };
    } catch (error) {
      return ctx.badRequest(toErrorMessage(error, 'Could not update menu item'));
    }
  },

  async delete(ctx: StrapiContext) {
    const id = ctx.params.id || ctx.params.documentId;

    if (!id) {
      return ctx.badRequest('Missing item id');
    }

    try {
      await strapi.service(serviceName).delete(id);
      ctx.body = { data: null };
    } catch (error) {
      return ctx.badRequest(toErrorMessage(error, 'Could not delete menu item'));
    }
  },
};

export = menuItemController;
