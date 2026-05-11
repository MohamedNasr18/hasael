const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const app =require('./app');
const mongoose =require('mongoose');
 
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));    

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 