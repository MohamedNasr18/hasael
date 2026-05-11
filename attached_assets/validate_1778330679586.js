const fs = require('fs');
const appError = require('../utilities/appError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {

      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.log(err);
        });
      }

      const messages = error.details.map(err => err.message);
      return next(new appError(messages.join(', '), 400));
    }

    req.body = value;
    next();
  };
};

module.exports = validate;