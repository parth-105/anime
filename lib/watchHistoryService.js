// Watch History Service - Tracks user progress like Netflix
class WatchHistoryService {
  constructor() {
    this.storageKey = 'dramadrift_watch_history'
    this.maxHistoryItems = 50 // Keep last 50 items
  }

  // Save watch progress
  saveProgress(contentId, type, season, episode, currentTime, duration, title, poster) {
    const history = this.getHistory()
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
    const rawPct = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 1
    // Clamp between 0 and <98 so it stays in Continue Watching until truly completed
    const progressPercentage = Math.max(0, Math.min(rawPct, 97.9))
    
    const progressData = {
      contentId,
      type,
      season: season || null,
      episode: episode || null,
      currentTime,
      duration: safeDuration,
      title,
      poster,
      lastWatched: new Date().toISOString(),
      progressPercentage
    }

    // Remove existing entry for this content
    const filteredHistory = history.filter(item => 
      !(item.contentId === contentId && 
        item.season === season && 
        item.episode === episode)
    )

    // Add new entry at the beginning
    const newHistory = [progressData, ...filteredHistory].slice(0, this.maxHistoryItems)
    
    localStorage.setItem(this.storageKey, JSON.stringify(newHistory))
    return progressData
  }

  // Get watch history
  getHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading watch history:', error)
      return []
    }
  }

  // Get continue watching items (incomplete)
  getContinueWatching() {
    const history = this.getHistory()
    return history.filter(item => 
      item.progressPercentage > 1 && // Started watching (more than 1%)
      item.progressPercentage < 98   // Not finished (less than 98%)
    ).slice(0, 10) // Show max 10 items
  }

  // Get specific progress
  getProgress(contentId, season, episode) {
    const history = this.getHistory()
    return history.find(item => 
      item.contentId === contentId && 
      item.season === season && 
      item.episode === episode
    )
  }

  // Mark as completed
  markCompleted(contentId, season, episode) {
    const history = this.getHistory()
    const updatedHistory = history.filter(item => 
      !(item.contentId === contentId && 
        item.season === season && 
        item.episode === episode)
    )
    localStorage.setItem(this.storageKey, JSON.stringify(updatedHistory))
  }

  // Clear all history
  clearHistory() {
    localStorage.removeItem(this.storageKey)
  }

  // Get watch statistics
  getStats() {
    const history = this.getHistory()
    const totalWatched = history.length
    const totalTime = history.reduce((sum, item) => sum + item.currentTime, 0)
    const completed = history.filter(item => item.progressPercentage >= 90).length
    
    return {
      totalWatched,
      totalTime: Math.round(totalTime / 60), // in minutes
      completed,
      continueWatching: this.getContinueWatching().length
    }
  }
}

export default new WatchHistoryService()
