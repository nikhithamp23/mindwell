const { Schema, model } = require('mongoose');

module.exports = model(
  'Mood',
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      mood: { type: Number, min: 1, max: 10, required: true },
      energy: { type: Number, min: 1, max: 10, required: true },
      emotions: [String],
    },
    { timestamps: true }
  )
);
