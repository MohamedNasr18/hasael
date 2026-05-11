const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');   
const {
  createFarm,
  getMyFarms,
  updateFarm,
  deleteFarm,
} = require('../controllers/farm');

router.use(protect);

router.post  ('/',          createFarm);    
router.get   ('/my-farms',  getMyFarms);   
router.patch ('/:id',       updateFarm);    
router.delete('/:id',       deleteFarm);    

module.exports = router;