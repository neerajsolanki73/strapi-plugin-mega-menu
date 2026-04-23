const UID = 'plugin::mega-menu.menu-item';
const TITLE_MAX_LENGTH = 120;
const URL_MAX_LENGTH = 2048;

type MenuPayload = {
  title?: string;
  url?: string;
  parent?: string | number | null;
};

type MenuDocument = {
  documentId?: string;
  parent?: { documentId?: string } | null;
};

const toNumericId = (value: unknown) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const normalizeOptionalString = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return '';
  return String(value).trim();
};

const createService = ({ strapi }: { strapi: any }) => ({
  async find() {
    return strapi.documents(UID).findMany({
      populate: ['parent'],
      sort: [{ createdAt: 'desc' }],
    });
  },

  async create(payload: MenuPayload) {
    const title = normalizeOptionalString(payload.title);
    const url = normalizeOptionalString(payload.url);

    if (!title) throw new Error('Title is required');
    if (!url) throw new Error('URL is required');
    if (title.length > TITLE_MAX_LENGTH) {
      throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters`);
    }
    if (url.length > URL_MAX_LENGTH) {
      throw new Error(`URL must be at most ${URL_MAX_LENGTH} characters`);
    }

    const data: Record<string, unknown> = {
      title,
      url,
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

  async update(id: string, payload: MenuPayload) {
    const documentId = await this.resolveDocumentId(id);

    if (!documentId) {
      throw new Error('Menu item not found');
    }

    const data: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      const title = normalizeOptionalString(payload.title);
      if (!title) throw new Error('Title cannot be empty');
      if (title.length > TITLE_MAX_LENGTH) {
        throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters`);
      }
      data.title = title;
    }
    if (payload.url !== undefined) {
      const url = normalizeOptionalString(payload.url);
      if (!url) throw new Error('URL cannot be empty');
      if (url.length > URL_MAX_LENGTH) {
        throw new Error(`URL must be at most ${URL_MAX_LENGTH} characters`);
      }
      data.url = url;
    }

    if (payload.parent !== undefined) {
      if (payload.parent === null || payload.parent === '') {
        data.parent = null;
      } else {
        const parentDocumentId = await this.resolveDocumentId(payload.parent);

        if (!parentDocumentId) {
          throw new Error('Parent item not found');
        }
        if (parentDocumentId === documentId) {
          throw new Error('An item cannot be its own parent');
        }
        const createsCycle = await this.wouldCreateCycle(documentId, parentDocumentId);
        if (createsCycle) {
          throw new Error('Invalid parent selection: cycle detected');
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

  async delete(id: string) {
    const documentId = await this.resolveDocumentId(id);

    if (!documentId) {
      throw new Error('Menu item not found');
    }

    await strapi.documents(UID).delete({ documentId });
  },

  async findOneByDocumentId(documentId: string) {
    return strapi.documents(UID).findOne({
      documentId,
      populate: ['parent'],
    });
  },

  async resolveDocumentId(idOrDocumentId: unknown) {
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

  async wouldCreateCycle(sourceDocumentId: string, candidateParentDocumentId: string) {
    let cursor: string | null = candidateParentDocumentId;

    while (cursor) {
      if (cursor === sourceDocumentId) return true;

      const row = (await strapi.db.query(UID).findOne({
        where: { documentId: cursor },
        select: ['documentId'],
        populate: {
          parent: {
            select: ['documentId'],
          },
        },
      })) as MenuDocument | null;

      const nextCursor = row?.parent?.documentId;
      cursor = typeof nextCursor === 'string' ? nextCursor : null;
    }

    return false;
  },
});

export = createService;
