const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    governorate: { type: String, required: true },   // المحافظة
    district:    { type: String },                    // المركز
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const investmentTermsSchema = new mongoose.Schema(
  {
    min_investment:  { type: Number, required: true },   // أقل مبلغ استثمار (EGP)
    expected_roi:    { type: Number, required: true },   // % العائد المتوقع
    duration_months: { type: Number, required: true },   // مدة العقد بالشهور
    profit_split:    { type: Number, default: 50 },      // % نصيب المستثمر من الأرباح
  },
  { _id: false }
);

const farmSchema = new mongoose.Schema(
  {
    // ── Ownership ──────────────────────────────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
      index: true,
    },

    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:    String,
      trim:    true,
      maxlength: 1000,
    },
    crop_type: {
      type:     String,
      required: true,
      enum: [
        'wheat', 'corn', 'rice', 'vegetables',
        'fruits', 'cotton', 'sugarcane', 'other',
      ],
    },
    size_feddan: {
      type:     Number,       // المساحة بالأفدنة
      required: true,
      min:      0.1,
    },
    location: {
      type:     locationSchema,
      required: true,
    },

    // ── Media ──────────────────────────────────────────────────────────────────
    cover_image: { type: String },                         // URL
    images:      [{ type: String }],                       // array of URLs
    documents:   [
      {
        label: { type: String },                           // e.g. "عقد ملكية"
        url:   { type: String, required: true },
      },
    ],

    // ── Investment terms ───────────────────────────────────────────────────────
    investment_terms: {
      type:     investmentTermsSchema,
      required: true,
    },

    // ── Feed / visibility ──────────────────────────────────────────────────────
    is_published: {
      type:    Boolean,
      default: false,           // false = draft; true = visible in investor feed
    },
    published_at: {
      type: Date,
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['available', 'under_negotiation', 'funded', 'closed'],
      default: 'available',
      index:   true,
    },

    // ── Stats (denormalised for feed performance) ──────────────────────────────
    views_count:    { type: Number, default: 0 },
    interest_count: { type: Number, default: 0 },   // كم مستثمر أبدى اهتمام
  },
  {
    timestamps: true,       // createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
farmSchema.index({ owner: 1, status: 1 });
farmSchema.index({ is_published: 1, status: 1, published_at: -1 });   // feed query
farmSchema.index({ 'location.governorate': 1 });

// ── Virtual: public flag for profile page ──────────────────────────────────────
farmSchema.virtual('is_public').get(function () {
  return this.is_published && this.status === 'available';
});

// ── Pre-save: set published_at when first published ───────────────────────────
farmSchema.pre('save', function (next) {
  if (this.isModified('is_published') && this.is_published && !this.published_at) {
    this.published_at = new Date();
  }
  next();
});

module.exports = mongoose.model('Farm', farmSchema);