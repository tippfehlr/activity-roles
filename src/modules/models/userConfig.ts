import mongoose, { Schema } from 'mongoose';

const userConfigSchema = new Schema(
  {
    _id: {
      type: String,
      required: true
    },
    autoRole: {
      type: Boolean,
      required: true
    }
  },
  { timestamps: true }
);

export const UserConfig = mongoose.model('UserConfig', userConfigSchema, 'UserConfig');
export interface UserConfigType {
  _id: string;
  autoRole: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
