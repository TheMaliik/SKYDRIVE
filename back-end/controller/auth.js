const asyncHandler = require("../middleware/async");
const User = require("../model/User");
const ErrorResponse = require("../utils/ErrorResponse");

exports.register = asyncHandler(async (req, res, next) => { 
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });
  const token = user.getSignedJwtToken();
  res.status(200).json({ success: true, token });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("User not found", 401));
  }

  const isMatch = await user.testPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid password", 401));
  }

  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res
    .status(200)
    .cookie("token", token, options)
    .json({ success: true, token, message: "Login successful" });
});

//get all the information about the profile
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

//forgot password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404));
  }

  const resetToken = await user.getResetPasswordToken();

  await user.save();

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetpassword/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message: resetUrl,
    });

    res.status(200).json({ success: true, data: "email sent" });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return next(new ErrorResponse("could not send the email", 500));
  }
});
//reset password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse("Invalid or expired token", 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  const token = user.getSignedJwtToken();
  res
    .status(200)
    .cookie("token", token, options)
    .json({ success: true, token });
});
//update user information
exports.updateDetails = asyncHandler(async (req, res, next) => {
  let fieldToUpdate = {};
  if (req.body.email) {
    fieldToUpdate.email = req.body.email;
  }
  if (req.body.name) {
    fieldToUpdate.name = req.body.name;
  }
  //check to see if there is any update in fields
  if (Object.keys(fieldToUpdate).length === 0) {
    return next(new ErrorResponse("there is no fields to update", 401));
  }
  const user = await User.findByIdAndUpdate(req.user.id, fieldToUpdate, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new ErrorResponse("No user found", 404));
  }
  res.status(200).json({ success: true, data: user });
});

//update user password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return next(new ErrorResponse("No user found", 404));
  }
  const password = req.body.password;
  const newPassword = req.body.newPassword;
  if (!password || !newPassword) {
    return next(new ErrorResponse("please provide a password", 401));
  }
  //Check the current password
  const isMatch = await user.testPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse("the password is incorrect"));
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, data: "password is updated" });
});

exports.logout = asyncHandler((req, res, next) => {
  //clear cookie
  res.cookie("token", "", {
    expires: new Date(Date.now() + 10),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ success: true, data: users });
});