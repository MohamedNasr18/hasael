const express=require('express')
const router = express.Router()
const validate = require('../middlewares/validate')
const {createUserSchema,updateUserSchema,signInSchema} = require('../validators/userSchema')
const protect = require('../middlewares/protect')
const upload = require('../middlewares/upload')

const {getAllUsers,signUp,signIn,updateUser,deleteUser}=require('../controllers/user.controller')

router.route('/')
.get(getAllUsers)

router.route('/signUp')
.post(upload.single('poster'),validate(createUserSchema),signUp)

router.route('/signIn')
.post(validate(signInSchema),signIn)


router.route('/:userId')  
.patch(protect,validate(updateUserSchema),updateUser)
.delete(protect,deleteUser)

module.exports=router