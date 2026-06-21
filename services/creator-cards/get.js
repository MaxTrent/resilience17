const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { throwAppError } = require('@app-core/errors');
const {
  ACTIVE_CARD_QUERY,
  CUSTOM_ERROR_CODES,
  getCardQuerySpec,
  serializeCreatorCard,
} = require('./shared');

async function getCreatorCardBySlug({ slug, accessCode }) {
  const card = await CreatorCardRepository.findOne({
    query: {
      slug,
      ...ACTIVE_CARD_QUERY,
    },
  });

  if (!card) {
    throwAppError(CreatorCardMessages.NOT_FOUND, CUSTOM_ERROR_CODES.NOT_FOUND);
  }

  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.NOT_FOUND, CUSTOM_ERROR_CODES.DRAFT_NOT_FOUND);
  }

  if (card.access_type === 'private') {
    validator.validate(
      typeof accessCode === 'undefined' ? {} : { access_code: accessCode },
      getCardQuerySpec
    );
  }

  if (card.access_type === 'private' && !accessCode) {
    throwAppError(
      CreatorCardMessages.PRIVATE_CARD_ACCESS_CODE_REQUIRED,
      CUSTOM_ERROR_CODES.PRIVATE_ACCESS_CODE_REQUIRED
    );
  }

  if (card.access_type === 'private' && card.access_code !== accessCode) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, CUSTOM_ERROR_CODES.INVALID_ACCESS_CODE);
  }

  return {
    message: CreatorCardMessages.RETRIEVAL_SUCCESS,
    data: serializeCreatorCard(card, { includeAccessCode: false }),
  };
}

module.exports = getCreatorCardBySlug;
