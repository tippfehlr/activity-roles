import mongoose, { Schema } from 'mongoose';

const guildDataSchema = new Schema({
  guildID: {
    type: String,
    required: true
  },
  roleID: {
    type: String,
    required: true
  },
  activityName: {
    type: String,
    required: true
  },
  exactActivityName: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('GuildData', guildDataSchema);
