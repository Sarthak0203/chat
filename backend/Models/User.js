const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { return !this.isOAuthUser; },
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: function() { return !this.isOAuthUser; },
    default: 'https://via.placeholder.com/150'
  },
  isOAuthUser: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;