import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let UserSchema = mongoose.Schema({
  email: {
    type: String
  },
  password: {
    type: String
  },
  active: {
    type: Boolean
  },
  secretToken: {
    type: String
  }
},
{
  timestamps: true
}
);

export const User = mongoose.model('User', UserSchema);
export const createUser = (newUser, callback) => {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        newUser.password = hash;
        newUser.save(callback);
    });
  });
}
export const updateUser = (user, updateValue, callback) => {
  User.findByIdAndUpdate(user._id, updateValue, callback);
}
export const getUserByEmail = (email, callback) => {
  let Obj = {
    email: email
  }
  User.findOne(Obj, callback);
}
export const comparePassword = (password, hash, callback) => {
  bcrypt.compare(password, hash, function (err, isMatch) {
    if (err) {
      throw err;
    }
    callback(null, isMatch);
  });
}
export const getUserByID = (id, callback) => {
  User.findById(id, callback);
}
export const getUserBySecretToken = (secretToken, callback) => {
  let Obj = {
    secretToken: secretToken
  }
  User.findOne(Obj, callback);
}