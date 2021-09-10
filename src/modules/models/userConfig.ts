import mongoose, { Schema } from 'mongoose';

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

export default mongoose.model('UserConfig', userConfigSchema);
