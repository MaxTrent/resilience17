const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { throwAppError } = require('@app-core/errors');
const {
  ACTIVE_CARD_QUERY,
  CUSTOM_ERROR_CODES,
  deleteCardSpec,
  serializeCreatorCard,
} = require('./shared');

async function deleteCreatorCardBySlug({ slug, body }) {
  validator.validate(body, deleteCardSpec);

  const activeCard = await CreatorCardRepository.findOne({
    query: {
      slug,
      ...ACTIVE_CARD_QUERY,
    },
  });

  if (!activeCard) {
    throwAppError(CreatorCardMessages.NOT_FOUND, CUSTOM_ERROR_CODES.NOT_FOUND);
  }

  const deletedTimestamp = Date.now();
  const CreatorCardModel = CreatorCardRepository.raw();

  const updateResult = await CreatorCardModel.updateOne(
    {
      slug,
      ...ACTIVE_CARD_QUERY,
    },
    {
      $set: {
        deleted: deletedTimestamp,
        updated: deletedTimestamp,
      },
    }
  );

  if (!updateResult?.matchedCount) {
    throwAppError(CreatorCardMessages.NOT_FOUND, CUSTOM_ERROR_CODES.NOT_FOUND);
  }

  return {
    message: CreatorCardMessages.DELETION_SUCCESS,
    data: serializeCreatorCard({
      ...activeCard,
      deleted: deletedTimestamp,
      updated: deletedTimestamp,
    }),
  };
}

module.exports = deleteCreatorCardBySlug;
