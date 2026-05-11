const Farm = require('../models/farm');

const asyncHandler = require('../middlewares/asyncHandler');

exports.createFarm = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    crop_type,
    size_feddan,
    location,
    cover_image,
    images,
    documents,
    investment_terms,
    is_published,
  } = req.body;

  const farm = await Farm.create({
    owner: req.user._id,      
    name,
    description,
    crop_type,
    size_feddan,
    location,
    cover_image,
    images,
    documents,
    investment_terms,
    is_published: is_published ?? false,
    status: 'available',
  });

  res.status(201).json({
    success: true,
    message: 'Farm created successfully',
    data: farm,
  });
});

exports.getMyFarms = asyncHandler(async (req, res) => {
  const { status, crop_type, is_published, page = 1, limit = 10 } = req.query;

  const filter = { owner: req.user._id };
  if (status)       filter.status       = status;
  if (crop_type)    filter.crop_type    = crop_type;
  if (is_published !== undefined) filter.is_published = is_published === 'true';

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Farm.countDocuments(filter);

  const farms = await Farm.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('-documents -__v');  

  res.status(200).json({
    success: true,
    message: 'Farms retrieved successfully',
    pagination: {
      total,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
    data: farms,
  });
});

exports.updateFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);

  if (!farm) {
    return res.status(404).json({ success: false, message: 'Farm not found' });
  }

  if (farm.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this farm' });
  }

  if (['funded', 'closed'].includes(farm.status)) {
    return res.status(400).json({
      success: false,
      message: `Farm with status "${farm.status}" cannot be edited`,
    });
  }

  // ── Allowed update fields (whitelist) ───────────────────────────────────────
  const ALLOWED = [
    'name', 'description', 'crop_type', 'size_feddan',
    'location', 'cover_image', 'images', 'documents',
    'investment_terms', 'is_published', 'status',
  ];

  ALLOWED.forEach(field => {
    if (req.body[field] !== undefined) farm[field] = req.body[field];
  });

  // ── Nested update: investment_terms (merge, not replace) ────────────────────
  if (req.body.investment_terms) {
    farm.investment_terms = {
      ...farm.investment_terms.toObject(),
      ...req.body.investment_terms,
    };
  }

  // ── Nested update: location (merge, not replace) ────────────────────────────
  if (req.body.location) {
    farm.location = {
      ...farm.location.toObject(),
      ...req.body.location,
    };
  }

  await farm.save();   // triggers pre-save hook (published_at auto-set)

  res.status(200).json({
    success: true,
    message: 'Farm updated successfully',
    data: farm,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE FARM          DELETE /api/farms/:id
// ══════════════════════════════════════════════════════════════════════════════
exports.deleteFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);

  // ── Guard: farm exists ──────────────────────────────────────────────────────
  if (!farm) {
    return res.status(404).json({ success: false, message: 'Farm not found' });
  }

  // ── Guard: only owner can delete ────────────────────────────────────────────
  if (farm.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this farm' });
  }

  // ── Guard: cannot delete active investment ──────────────────────────────────
  if (['under_negotiation', 'funded'].includes(farm.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete a farm that is currently "${farm.status}"`,
    });
  }

  await farm.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Farm deleted successfully',
    data: null,
  });
});