import mongoose from 'mongoose'

const AnalyticsEventSchema = new mongoose.Schema({
  ts: { type: Date, default: Date.now, index: true },
  sid: { type: String, index: true },
  aid: { type: String, index: true },
  type: { type: String, enum: ['pageview','heartbeat','video_play','video_pause','video_milestone','exit','search'], index: true },
  path: String,
  ref: String,
  utm: {
    source: String,
    medium: String,
    campaign: String
  },
  device: {
    ua: String,
    width: Number,
    height: Number
  },
  geo: {
    country: String,
    region: String,
    city: String
  },
  content: {
    id: String,
    type: String,
    genre: [String]
  },
  payload: mongoose.Schema.Types.Mixed
}, { versionKey: false })

AnalyticsEventSchema.index({ 'geo.country': 1, ts: -1 })
AnalyticsEventSchema.index({ 'content.type': 1, ts: -1 })

export default mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema)


