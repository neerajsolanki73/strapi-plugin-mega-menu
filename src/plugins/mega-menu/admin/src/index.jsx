import { List } from '@strapi/icons';

const PLUGIN_ID = 'mega-menu';
const CUSTOM_FIELD_NAME = 'mega-menu-builder';

export default {
  register(app) {
    app.customFields.register({
      name: CUSTOM_FIELD_NAME,
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: `${PLUGIN_ID}.customField.label`,
        defaultMessage: 'Mega Menu Builder',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.customField.description`,
        defaultMessage:
          'Reusable nested mega menu editor. Add it in any content type.',
      },
      icon: List,
      components: {
        Input: async () => import('./components/MegaMenuFieldInput.jsx'),
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      name: 'Mega Menu',
    });
  },

  bootstrap() {},
};
