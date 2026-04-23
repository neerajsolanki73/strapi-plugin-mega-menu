'use strict';

const UID = 'plugin::mega-menu.menu-item';

const toNumericId = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

module.exports = ({ strapi }) => ({
  async find() {
    return strapi.documents(UID).findMany({
      populate: ['parent'],
      sort: [{ createdAt: 'desc' }],
    });
  },

  async create(payload) {
    const data = {
      title: payload.title,
      url: payload.url,
    };

    if (payload.parent !== undefined && payload.parent !== null && payload.parent !== '') {
      const parentDocumentId = await this.resolveDocumentId(payload.parent);

      if (!parentDocumentId) {
        throw new Error('Parent item not found');
      }

      data.parent = { documentId: parentDocumentId };
    }

    const created = await strapi.documents(UID).create({ data });

    return this.findOneByDocumentId(created.documentId);
  },

  async update(id, payload) {
    const documentId = await this.resolveDocumentId(id);

    if (!documentId) {
      throw new Error('Menu item not found');
    }

    const data = {};

    if (payload.title !== undefined) data.title = payload.title;
    if (payload.url !== undefined) data.url = payload.url;

    if (payload.parent !== undefined) {
      if (payload.parent === null || payload.parent === '') {
        data.parent = null;
      } else {
        const parentDocumentId = await this.resolveDocumentId(payload.parent);

        if (!parentDocumentId) {
          throw new Error('Parent item not found');
        }

        data.parent = { documentId: parentDocumentId };
      }
    }

    await strapi.documents(UID).update({
      documentId,
      data,
    });

    return this.findOneByDocumentId(documentId);
  },

  async delete(id) {
    const documentId = await this.resolveDocumentId(id);

    if (!documentId) {
      throw new Error('Menu item not found');
    }

    await strapi.documents(UID).delete({ documentId });
  },

  async findOneByDocumentId(documentId) {
    return strapi.documents(UID).findOne({
      documentId,
      populate: ['parent'],
    });
  },

  async resolveDocumentId(idOrDocumentId) {
    if (!idOrDocumentId) return null;

    const numericId = toNumericId(idOrDocumentId);

    const where = numericId
      ? { $or: [{ id: numericId }, { documentId: String(idOrDocumentId) }] }
      : { documentId: String(idOrDocumentId) };

    const row = await strapi.db.query(UID).findOne({
      where,
      select: ['documentId'],
    });

    return row?.documentId ?? null;
  },
});
