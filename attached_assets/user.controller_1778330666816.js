const User = require('../models/user')
const appError = require('../utilities/appError.js')
const httpStatus = require('../utilities/httpStatus')
const asyncHandler = require('../middlewares/asyncHandler')
const bcrypt = require('bcrypt')
const {generateToken} = require('../utilities/tokenHandler.js')

const getAllUsers = asyncHandler(async(req,res,next)=>{
    const users = await User.find()
    res.status(200).json({
        status:httpStatus.SUCCESS,
        data:users
    }
)
})

const signUp = asyncHandler(async (req, res, next) => {
  const { full_name, email, password } = req.body;

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return next(new appError('Email already exists', 400));
  }


  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    full_name,
    email,
    password: hashedPassword,
    poster: req.file ? req.file.path : undefined,
  });
  const token = generateToken({ id: user._id, role: user.role })

  user.password = undefined;

  res.status(201).json({
    status: httpStatus.SUCCESS,
    message: "User created successfully",
    data: user,
    token
  });
});
 
const signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

const user = await User.findOne({ email }).select('+password');  if (!user) {
    return next(new appError('Invalid email or password', 401));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new appError('Invalid email or password', 401));
  }

  const token = generateToken({ id: user._id, role: user.role });

  user.password = undefined;

  res.status(200).json({
    status: httpStatus.SUCCESS,
    message: 'Logged in successfully',
    data: user,
    token
  });
});

const updateUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  const user = req.user;

  if (user.id !== userId && user.role !== "ADMIN") {
    return next(new appError("Not authorized", 403));
  }

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  const userToUpdate = await User.findByIdAndUpdate(
    userId,
    req.body,
    { new: true, runValidators: true }
  );

  if (!userToUpdate) {
    return next(new appError("user not found", 404));
  }

  userToUpdate.password = undefined;

  res.status(200).json({
    status: httpStatus.SUCCESS,
    message: "User updated successfully",
    data: userToUpdate
  });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  const user = req.user;

  if (user.id !== userId && user.role !== 'ADMIN') {
    return next(new appError('Not authorized', 403));
  }

  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) {
    return next(new appError('User not found', 404));
  }

  res.status(200).json({
    status: httpStatus.SUCCESS,
    message: 'User deleted successfully',
    data: null
  });
});

    module.exports={
        getAllUsers,
        signUp,
        signIn,
        updateUser,
        deleteUser
    }