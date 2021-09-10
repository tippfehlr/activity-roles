import mongoose, { Schema } from 'mongoose';

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

export default mongoose.model('GuildConfig', guildConfigSchema);