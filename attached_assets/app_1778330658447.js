const express = require('express');
const cors= require('cors');
const morgan =require('morgan');

const app = express();
app.use('/uploads', express.static('uploads'));
const userRoutes = require('./routes/user-routes')
const farmRoutes = require('./routes/farm-routes')

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use('/users',userRoutes)
app.use('/farms',farmRoutes) 

app.use((error, req, res, next) => {  
  res.status(error.statusCode || 500).json({
    status: error.status || "error",
    message: error.message
  });
}); 

module.exports = app;