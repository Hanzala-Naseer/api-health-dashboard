const mongoose = require('mongoose');
const { OTP_PURPOSE, OTP_STATUS } = require('../config/constants');

const otpVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    purpose: { type: String, enum: Object.values(OTP_PURPOSE), required: true },
    status: { type: String, enum: Object.values(OTP_STATUS), default: OTP_STATUS.PENDING },

    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },

    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },

    // Delivery tracking
    deliveryChannel: { type: String, default: 'email' }, // email | sms
    deliveryStatus: { type: String, default: 'pending' }, // pending | sent | delivered | failed
    deliveredAt: { type: Date, default: null },

    // Rate limiting
    requestCount: { type: Number, default: 1 },
    lastRequestedAt: { type: Date, default: Date.now },

    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

otpVerificationSchema.index({ userId: 1, purpose: 1, createdAt: -1 });
otpVerificationSchema.index({ status: 1 });
otpVerificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.models.OtpVerification || mongoose.model('OtpVerification', otpVerificationSchema);
