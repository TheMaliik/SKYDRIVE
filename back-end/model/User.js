const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "please add the user name"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "please add the user email"],
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user",
  },
  password: {
    type: String,
    require: [true, "please add the password"],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, "gqdsfdqsgrestqsdfvqs", {
    expiresIn: "30d",
  });
};

UserSchema.methods.testPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};


module.exports = mongoose.model("User", UserSchema);