import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let UserSchema = mongoose.Schema({
  email: {
    type: String
  },
  password: {
    type: String
  },
  user_type: [{
    name: {
      type: String
    },
    status: {
      type: String
    }
  }],
  active: {
    type: Boolean
  },
  secretToken: {
    type: String
  },
  profile: [{
    registration_type: {
      type: String
    },
    name: {
      type: String
    },
    phone: {
      type: String
    },
    gender: {
      type: String
    },
    established_place: {
      type: String
    },
    company_phone: {
      type: String
    },
    birth_date: {
      type: Date
    },
    province: [{
      province_id: {
        type: Number
      },
      province_name: {
        type: String
      }
    }],
    city: [{
      city_id: {
        type: Number
      },
      city_name: {
        type: String
      }
    }],
    district: [{
      district_id: {
        type: Number
      },
      district_name: {
        type: String
      }
    }],
    sub_district: [{
      sub_district_id: {
        type: Number
      },
      sub_district_name: {
        type: String
      }
    }],
    address: {
      type: String
    }
  }],
  occupation: [{
    occupation: {
      type: String
    },
    company_name: {
      type: String
    },
    company_address: {
      type: String
    },
    position: {
      type: String
    },
    income: {
      type: String
    },
    income_source: {
      type: String
    }
  }],
  pic: [{
    pic_name: {
      type: String
    },
    pic_birth_date: {
      type: Date
    },
    pic_identity_number: {
      type: Number
    },
    pic_identity_image: {
      type: String
    },
    pic_identity_selfie_image: {
      type: String
    }
  }],
  document: [{
    identity_number: {
      type: Number
    },
    identity_image: {
      type: String
    },
    identity_selfie_image: {
      type: String
    },
    npwp_number: {
      type: Number
    },
    npwp_image: {
      type: String
    },
    company_registration_number: {
      type: Number
    },
    company_registration_image: {
      type: String
    },
    sk_kemenkumham_number: {
      type: Number
    },
    sk_kemenkumham_image: {
      type: String
    },
    business_permit_image: {
      type: String
    }
  }],
  bank: [{
    bank_name: {
      type: String
    },
    account_name: {
      type: String
    },
    account_number: {
      type: String
    },
    branch: {
      type: String
    }
  }],
  contract : {
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
export const getUserByIdentityNumber = (identity_number, callback) => {
  User.findOne({ 'document.identity_number': identity_number }, callback);
}

export const getUserByPICIdentityNumber = (identity_number, callback) => {
  User.findOne({ 'pic.identity_number': identity_number }, callback);
}