const jwt = require('jsonwebtoken')
const generateToken=(payLoad)=>{
   return jwt.sign(payLoad,process.env.JWT_SECRET,{expiresIn:"2h"})
}
const verifyToken = (token)=>{
    return jwt.verify(token,process.env.JWT_SECRET)
}

module.exports={generateToken,verifyToken}