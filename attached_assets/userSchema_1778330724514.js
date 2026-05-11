const Joi = require('joi');

const createUserSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .max(100)
    .required(),

    role: Joi.string()
    .valid("INVESTOR","FARM_OWNER","OPERATOR","ADMIN","USER")
    .default("INVESTOR"),
 
  poster: Joi.string()
    .uri()
    .optional()
});

const updateUserSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(3)
    .max(50),

  email: Joi.string()
    .email(),

  password: Joi.string()
    .min(6)
    .max(100),

  poster: Joi.string()
    .uri()
    .optional()
}).min(1); 

const signInSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .required()
});
 
module.exports =  {createUserSchema,updateUserSchema,signInSchema};