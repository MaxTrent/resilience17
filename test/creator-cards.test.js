const assert = require('assert');
const createMockServer = require('@app-core/mock-server');
const { MockModelStubs } = require('@app/mock-models');

const server = createMockServer(['./endpoints/creator-cards']);
const CreatorCardStub = MockModelStubs.CreatorCard;

function createCard(overrides = {}) {
  return CreatorCardStub.createDocument({
    _id: '01JG8XYZA2B3C4D5E6F7G8H9J0',
    title: 'George Cooks',
    description: 'Weekly cooking podcast',
    slug: 'george-cooks',
    creator_reference: 'crt_8f2k1m9x4p7w3q5z',
    links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
    service_rates: {
      currency: 'NGN',
      rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
    },
    status: 'published',
    access_type: 'public',
    access_code: null,
    created: 1767052800000,
    updated: 1767052800000,
    deleted: null,
    ...overrides,
  });
}

describe('Creator Cards endpoints', () => {
  it('creates a published public card with id and null access_code', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: 'George Cooks',
        description: 'Weekly cooking podcast',
        slug: 'george-cooks',
        creator_reference: 'crt_8f2k1m9x4p7w3q5z',
        links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
        },
        status: 'published',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Created Successfully.');
    assert.ok(response.data.data.id);
    assert.strictEqual(response.data.data._id, undefined);
    assert.strictEqual(response.data.data.access_type, 'public');
    assert.strictEqual(response.data.data.access_code, null);
    assert.strictEqual(response.data.data.links[0]._id, undefined);
    assert.strictEqual(response.data.data.service_rates.rates[0]._id, undefined);
  });

  it('auto-generates a slug from title when omitted', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.data.slug, 'ada-designs-things');
  });

  it('appends a suffix when the auto-generated slug already exists', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      overrideFn(queryData) {
        if (queryData.query.slug === 'ada-designs-things') {
          return createCard({ slug: 'ada-designs-things' });
        }

        return null;
      },
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.match(response.data.data.slug, /^ada-designs-things-[a-z0-9]{6}$/);
  });

  it('supports a title that strips to an empty slug base', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: '!!!',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.match(response.data.data.slug, /^card-[a-z0-9]{6}$/);
  });

  it('returns AC01 when access_code is missing on private cards', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'VIP Rate Card',
        creator_reference: 'crt_x9y8z7w6v5u4t3s2',
        status: 'published',
        access_type: 'private',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, 'AC01');
  });

  it('returns AC05 when access_code is set on public cards', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'Public Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'public',
        access_code: 'A1B2C3',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, 'AC05');
  });

  it('creates a private card without service_rates when access_code is provided', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: 'VIP Rate Card',
        creator_reference: 'crt_x9y8z7w6v5u4t3s2',
        status: 'published',
        access_type: 'private',
        access_code: 'A1B2C3',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.data.access_type, 'private');
    assert.strictEqual(response.data.data.access_code, 'A1B2C3');
  });

  it('returns SL02 when a client-provided slug is already taken by an active card', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({ slug: 'george-cooks' }),
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: 'Another George',
        slug: 'george-cooks',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, 'SL02');
  });

  it('returns 400 for an invalid slug pattern via VSL', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'Another George',
        slug: 'bad slug!',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('returns 400 for a non-http link URL via VSL', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'Creator Links',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
        links: [{ title: 'Portfolio', url: 'ftp://example.com' }],
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('returns 400 for a non-integer rate amount via VSL', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'Creator Rates',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'Brand Post', description: 'One brand post', amount: 99.5 }],
        },
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('returns 400 when service_rates.rates is an empty array', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'Creator Rates',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
        service_rates: {
          currency: 'NGN',
          rates: [],
        },
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('returns 400 for an invalid status via VSL', async () => {
    const response = await server.post('/creator-cards', {
      body: {
        title: 'Bad Status Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'archived',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('returns 400 for invalid delete body creator_reference via VSL', async () => {
    const response = await server.delete('/creator-cards/george-cooks', {
      body: {
        creator_reference: 'short',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('retrieves a public published card without leaking access_code', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard(),
    });

    const response = await server.get('/creator-cards/george-cooks');

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Retrieved Successfully.');
    assert.strictEqual(response.data.data.id, '01JG8XYZA2B3C4D5E6F7G8H9J0');
    assert.strictEqual(Object.hasOwn(response.data.data, 'access_code'), false);
    assert.strictEqual(response.data.data.links[0]._id, undefined);
    assert.strictEqual(response.data.data.service_rates.rates[0]._id, undefined);
  });

  it('retrieves a private published card with the correct pin without leaking access_code', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({
        slug: 'vip-rate-card',
        access_type: 'private',
        access_code: 'A1B2C3',
      }),
    });

    const response = await server.get('/creator-cards/vip-rate-card', {
      query: { access_code: 'A1B2C3' },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Retrieved Successfully.');
    assert.strictEqual(response.data.data.id, '01JG8XYZA2B3C4D5E6F7G8H9J0');
    assert.strictEqual(Object.hasOwn(response.data.data, 'access_code'), false);
  });

  it('returns NF02 when the card exists but is a draft', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({ status: 'draft' }),
    });

    const response = await server.get('/creator-cards/my-draft-card');

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.data.code, 'NF02');
  });

  it('returns AC03 when a private card is requested without a pin', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({ access_type: 'private', access_code: 'A1B2C3' }),
    });

    const response = await server.get('/creator-cards/vip-rate-card');

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.data.code, 'AC03');
  });

  it('returns AC04 when a private card is requested with the wrong pin', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({ access_type: 'private', access_code: 'A1B2C3' }),
    });

    const response = await server.get('/creator-cards/vip-rate-card', {
      query: { access_code: 'WRONG1' },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.data.code, 'AC04');
  });

  it('returns 400 for malformed retrieval access_code via VSL', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({ access_type: 'private', access_code: 'A1B2C3' }),
    });

    const response = await server.get('/creator-cards/vip-rate-card', {
      query: { access_code: 'BAD' },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, undefined);
  });

  it('returns NF01 when a card is missing', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.get('/creator-cards/does-not-exist-123');

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.data.code, 'NF01');
  });

  it('returns NF01 before validating access_code when the card is missing', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.get('/creator-cards/does-not-exist-123', {
      query: { access_code: 'BAD' },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.data.code, 'NF01');
  });

  it('returns NF01 when deleting a card that does not exist', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.delete('/creator-cards/does-not-exist-123', {
      body: {
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.data.code, 'NF01');
  });

  it('returns the deleted card with matching deleted and updated timestamps', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      docConfig: createCard({ slug: 'ada-designs-things' }),
    });

    const response = await server.delete('/creator-cards/ada-designs-things', {
      body: {
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Deleted Successfully.');
    assert.strictEqual(response.data.data.deleted, response.data.data.updated);
    assert.strictEqual(response.data.data.access_code, null);
    assert.strictEqual(response.data.data.links[0]._id, undefined);
    assert.strictEqual(response.data.data.service_rates.rates[0]._id, undefined);
  });

  it('returns NF01 when retrieving a deleted card', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      mockNull: true,
    });

    const response = await server.get('/creator-cards/ada-designs-things');

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.data.code, 'NF01');
  });

  it('surfaces slug-retry exhaustion as a server error using mocked collisions', async () => {
    const findOneConfig = CreatorCardStub.configureStubs({
      method: 'findOne',
      overrideFn() {
        return createCard();
      },
    });

    const response = await server.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      },
    });

    findOneConfig.revert();

    assert.strictEqual(response.statusCode, 500);
  });
});
