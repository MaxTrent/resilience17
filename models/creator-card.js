const mongoose = require('mongoose');
const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

const linkSchema = new mongoose.Schema(
  {
    title: { type: SchemaTypes.String, required: true },
    url: { type: SchemaTypes.String, required: true },
  },
  { _id: false, id: false }
);

const rateSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, required: true },
    description: { type: SchemaTypes.String, required: true },
    amount: { type: SchemaTypes.Number, required: true },
  },
  { _id: false, id: false }
);

const serviceRatesSchema = new mongoose.Schema(
  {
    currency: { type: SchemaTypes.String, required: true },
    rates: { type: [rateSchema], required: true },
  },
  { _id: false, id: false }
);

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String, required: true },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, required: true },
  creator_reference: { type: SchemaTypes.String, required: true },
  links: { type: [linkSchema] },
  service_rates: { type: serviceRatesSchema, default: undefined },
  status: { type: SchemaTypes.String, required: true },
  access_type: { type: SchemaTypes.String, required: true },
  access_code: { type: SchemaTypes.String, default: null },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
  deleted: { type: SchemaTypes.Number, default: null },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

modelSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { deleted: null },
  }
);

module.exports = DatabaseModel.model(modelName, modelSchema);
