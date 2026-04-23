import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'mega-menu': {
    enabled: true,
    resolve: './src/plugins/mega-menu',
  },
});

export default config;
