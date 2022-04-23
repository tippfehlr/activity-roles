import mongoose, { Schema } from 'mongoose';

const guildDataSchema = new Schema(
  {
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
    },
    live: {
      type: Boolean,
      required: true
    }
  },
  { timestamps: true }
);

export const GuildData = mongoose.model('GuildData', guildDataSchema, 'GuildData');
export interface GuildDataType {
  _id: string;
  guildID: string;
  roleID: string;
  activityName: string;
  exactActivityName: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  live: boolean;
}
