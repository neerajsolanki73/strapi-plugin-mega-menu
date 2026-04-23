'use strict';

module.exports = {
  kind: 'collectionType',
  collectionName: 'mega_menu_items',
  info: {
    singularName: 'menu-item',
    pluralName: 'menu-items',
    displayName: 'Menu item',
    description: 'Mega menu navigation item',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {},
  attributes: {
    title: {
      type: 'string',
      required: true,
    },
    url: {
      type: 'string',
      required: true,
    },
    parent: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'plugin::mega-menu.menu-item',
      inversedBy: 'children',
    },
    children: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'plugin::mega-menu.menu-item',
      mappedBy: 'parent',
    },
  },
};
