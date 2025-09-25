import mongoose from 'mongoose'

const SubtitleSchema = new mongoose.Schema({
  lang: String,
  label: String,
  src: String,
}, { _id: false })

const SourceSchema = new mongoose.Schema({
  quality: String,
  src: String,
  subtitles: [SubtitleSchema]
}, { _id: false })

const EpisodeSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  duration: Number,
  src: String,
  subtitles: [SubtitleSchema]
}, { _id: false })

const SeasonSchema = new mongoose.Schema({
  season: Number,
  episodes: [EpisodeSchema]
}, { _id: false })

const ContentSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  slug: { type: String, unique: true, index: true },
  type: { type: String, enum: ['movie','series','webseries','kdrama','anime','drama','documentary','reality','comedy'] },
  // format distinguishes sub-types (e.g., anime movie vs anime series)
  format: { type: String, enum: ['movie','series'], required: false },
  title: { type: String, required: true },
  year: Number,
  duration: Number,
  description: String,
  poster: String,
  embedUrl: String,
  rating: Number,
  genre: [String],
  cast: [String],
  director: String,
  country: String,
  language: String,
  sources: [SourceSchema],
  seasons: [SeasonSchema],
  // Admin-curated trending flags
  isTrending: { type: Boolean, default: false, index: true },
  // Admin rank (1 is highest). Use `rank`; keep `trendingRank` for backward compat
  rank: { type: Number, default: null, index: true },
  trendingRank: { type: Number, default: null, index: true },
  createdAt: { type: Date, default: Date.now }
})

// Indexes for production performance
ContentSchema.index({ title: 'text', description: 'text' })
ContentSchema.index({ type: 1, createdAt: -1 })
ContentSchema.index({ rating: -1, createdAt: -1 })
ContentSchema.index({ year: -1, createdAt: -1 })
ContentSchema.index({ genre: 1 })
ContentSchema.index({ rank: 1 })
ContentSchema.index({ trendingRank: 1 })

export default mongoose.models.Content || mongoose.model('Content', ContentSchema)


