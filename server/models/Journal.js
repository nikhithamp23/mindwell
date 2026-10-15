const { Schema, model } = require('mongoose');

module.exports = model(
  'Journal',
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      prompt: { type: String, maxlength: 200 },
      // AES-256-GCM encrypted text: "iv:tag:ciphertext" (base64). Never plain text.
      content: { type: String, required: true },
    },
    { timestamps: true }
  )
);
