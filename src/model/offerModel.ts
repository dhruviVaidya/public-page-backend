import * as mongoose from "mongoose";

const payment_type = new mongoose.Schema({
  pay_type: { type: String, default: null },
  price: { type: Number, default: 0 },
  currency: { type: String, default: null },
  months: { type: Number, default: 0 },
  bill_every: { type: Number, default: 0 },
  interval: { type: String, default: null },
});
const post_email = new mongoose.Schema({
  type: { type: String, default: "default" },
  mail_body: { type: String, default: null },
  mail_subject: { type: String, default: null },
});
const offerSchema = new mongoose.Schema(
  {
    business_id: {
      required: true,
      trim: true,
      type: String,
    },
    company_id: {
      required: true,
      trim: true,
      type: String,
    },
    title: {
      required: true,
      trim: true,
      max: 140,
      type: String,
    },
    description: { trim: true, type: String, max: 200 },
    course_ids: {
      type: Array,
      ref: "tbl_course",
      default: null,
    },
    thumbnail: { type: String, default: null },
    payment_type: {
      type: payment_type,
      default: {},
    },
    post_email: {
      type: post_email,
      default: {},
    },
    status: {
      type: Boolean,
      default: false,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("tbl_offer", offerSchema);
