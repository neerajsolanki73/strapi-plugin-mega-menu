'use strict';

const authPolicies = ['admin::isAuthenticatedAdmin'];

const routes = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/items',
      handler: 'menu-item.find',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'POST',
      path: '/items',
      handler: 'menu-item.create',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'PUT',
      path: '/items/:id',
      handler: 'menu-item.update',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'DELETE',
      path: '/items/:id',
      handler: 'menu-item.delete',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'GET',
      path: '/menu-items',
      handler: 'menu-item.find',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'POST',
      path: '/menu-items',
      handler: 'menu-item.create',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'PUT',
      path: '/menu-items/:documentId',
      handler: 'menu-item.update',
      config: {
        policies: authPolicies,
      },
    },
    {
      method: 'DELETE',
      path: '/menu-items/:documentId',
      handler: 'menu-item.delete',
      config: {
        policies: authPolicies,
      },
    },
  ],
};

module.exports = routes;
