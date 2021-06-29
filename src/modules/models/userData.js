const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const UserData = mongoose.model('UserData', userDataSchema);
module.exports = UserData;