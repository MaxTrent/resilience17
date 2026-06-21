const { createHandler } = require('@app-core/server');
const getCreatorCardBySlug = require('@app/services/creator-cards/get');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const response = await getCreatorCardBySlug({
      slug: rc.params.slug,
      accessCode: rc.query.access_code,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: response.message,
      data: response.data,
    };
  },
});
