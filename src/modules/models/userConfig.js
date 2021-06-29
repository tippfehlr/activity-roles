const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userConfigSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  autoRole: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

const UserConfig = mongoose.model('UserConfig', userConfigSchema);
module.exports = UserConfig;