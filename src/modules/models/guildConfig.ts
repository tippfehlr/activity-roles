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

export const GuildConfig =  mongoose.model('GuildConfig', guildConfigSchema);
export interface GuildConfigType {
  _id:          string;
  createdAt:    string;
  updatedAt:    string;
  __v:          number;
  logChannelID: string;
}
