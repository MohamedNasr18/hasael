const mongoose =require('mongoose');

const userSchema = mongoose.Schema({
full_name:{
    type:String,
    required:true
},
email:{
    type:String,
    required:true,
    unique:true
},
password:{
    type:String,
    required:true,
    select:false
},
poster:{ 
 type:String
},
role: {
  type: String,
  enum: ["FARM_OWNER", "INVESTOR", "OPERATOR","ADMIN","USER"],
  default: "INVESTOR"
}
})
module.exports= mongoose.model("User", userSchema);