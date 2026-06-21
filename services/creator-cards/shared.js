const validator = require('@app-core/validator');
const { randomBytes } = require('@app-core/randomness');

const ACTIVE_CARD_QUERY = { deleted: null };
const CUSTOM_ERROR_CODES = {
  SLUG_TAKEN: 'SL02',
  ACCESS_CODE_REQUIRED: 'AC01',
  NOT_FOUND: 'NF01',
  DRAFT_NOT_FOUND: 'NF02',
  PRIVATE_ACCESS_CODE_REQUIRED: 'AC03',
  INVALID_ACCESS_CODE: 'AC04',
  ACCESS_CODE_FORBIDDEN: 'AC05',
};

const createCardSpec = validator.parse(`root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthBetween:5,50|matches:^[A-Za-z0-9_-]+$>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|matches:^https?://.+$>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount integer<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6|matches:^[A-Za-z0-9]{6}$>
}`);

const deleteCardSpec = validator.parse(`root {
  creator_reference string<trim|length:20>
}`);

const getCardQuerySpec = validator.parse(`root {
  access_code? string<trim|length:6|matches:^[A-Za-z0-9]{6}$>
}`);

function stripMongoId(value) {
  if (!value) {
    return value;
  }

  if (Array.isArray(value)) {
    return Array.from(value, stripMongoId);
  }

  if (typeof value !== 'object') {
    return value;
  }

  const plainValue = typeof value.toObject === 'function' ? value.toObject() : value;
  const clonedValue = { ...plainValue };
  delete clonedValue._id;

  Object.keys(clonedValue).forEach((key) => {
    clonedValue[key] = stripMongoId(clonedValue[key]);
  });

  return clonedValue;
}

function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = true } = options;
  const serializedCard = {
    id: card._id,
    title: card.title,
    description: card.description,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: stripMongoId(card.links),
    service_rates: stripMongoId(card.service_rates),
    status: card.status,
    access_type: card.access_type,
    created: card.created,
    updated: card.updated,
    deleted: card.deleted,
  };

  if (includeAccessCode) {
    serializedCard.access_code = card.access_code ?? null;
  }

  return serializedCard;
}

function buildSlugBase(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

function generateSlugSuffix() {
  return randomBytes(6);
}

module.exports = {
  ACTIVE_CARD_QUERY,
  CUSTOM_ERROR_CODES,
  createCardSpec,
  deleteCardSpec,
  getCardQuerySpec,
  serializeCreatorCard,
  buildSlugBase,
  generateSlugSuffix,
};
