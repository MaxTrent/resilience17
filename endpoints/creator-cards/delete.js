const { createHandler } = require('@app-core/server');
const deleteCreatorCardBySlug = require('@app/services/creator-cards/delete');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const response = await deleteCreatorCardBySlug({
      slug: rc.params.slug,
      body: rc.body,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: response.message,
      data: response.data,
    };
  },
});
