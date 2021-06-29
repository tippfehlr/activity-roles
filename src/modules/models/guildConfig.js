const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const guildConfigSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  logChannelID: {
    type: String,
    required: false
  }
  //more guild settings here
}, { timestamps: true });

const GuildConfig = mongoose.model('GuildConfig', guildConfigSchema);
module.exports = GuildConfig;