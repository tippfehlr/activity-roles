import mongoose, { Schema } from 'mongoose';

const userDataSchema = new Schema({
  userID: {
    type: String,
    required: true
  },
  activityName: {
    type: String,
    required: true
  },
  autoRole: {
    type: Boolean,
    required: true
  },
  ignored: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('UserData', userDataSchema);
