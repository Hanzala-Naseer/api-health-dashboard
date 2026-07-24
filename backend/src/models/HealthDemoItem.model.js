const mongoose = require('mongoose');

const HEALTH_DEMO_ITEM_STATUS = ['ACTIVE', 'ARCHIVED'];

/**
 * HealthDemoItem
 *
 * WHY this collection exists (Feature 3):
 * PulseOps users need to safely configure monitoring for POST/PUT/PATCH/
 * DELETE without risking real application data (e.g. scheduling a POST
 * every minute against a real /orders endpoint would create real orders).
 * This model backs a dedicated, isolated CRUD resource — completely
 * separate from any real PulseOps business collection — that behaves like
 * a genuine customer resource so scheduled/manual health checks against it
 * are realistic, but repeated execution only ever mutates *this* collection.
 *
 * Fields intentionally mirror a typical customer resource (name,
 * description, price, quantity, status) so demo CRUD responses look and
 * behave like a real production API.
 */
const healthDemoItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: null },
    sku: { type: String, trim: true, maxlength: 100, default: null },
    price: { type: Number, min: 0, default: 0 },
    quantity: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: HEALTH_DEMO_ITEM_STATUS, default: 'ACTIVE' },

    // Free-form metadata so demo requests can exercise arbitrary JSON bodies,
    // the same way a real customer resource often accepts extra fields.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

healthDemoItemSchema.index({ userId: 1 });
healthDemoItemSchema.index({ userId: 1, createdAt: -1 });

module.exports =
  mongoose.models.HealthDemoItem || mongoose.model('HealthDemoItem', healthDemoItemSchema);

module.exports.HEALTH_DEMO_ITEM_STATUS = HEALTH_DEMO_ITEM_STATUS;
