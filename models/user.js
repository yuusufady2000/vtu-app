const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    email: {
    type: String,
    required: true
  },
  phoneNumber: {
      type: String,
      required:true
  },

    password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetExpire: Date,
});

module.exports = mongoose.model('User', userSchema);