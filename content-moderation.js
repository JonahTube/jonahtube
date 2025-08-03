/**
 * JonahTube Content Moderation System
 * Ensures all user-generated content is safe and appropriate
 */
class ContentModerationSystem {
  constructor() {
    // Comprehensive list of inappropriate words and patterns
    this.inappropriateWords = [
      // Curse words
      'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb', 'loser',
      'hate', 'kill', 'die', 'death', 'murder', 'violence', 'hurt', 'pain',
      'fight', 'attack', 'destroy', 'evil', 'devil', 'satan',
      
      // Inappropriate content
      'sex', 'porn', 'nude', 'naked', 'adult', 'mature', 'explicit',
      'drug', 'drugs', 'alcohol', 'beer', 'wine', 'drunk', 'high',
      'smoke', 'smoking', 'cigarette', 'weed', 'marijuana',
      
      // Threats and harassment
      'threat', 'threaten', 'bully', 'harass', 'abuse', 'harmful',
      'dangerous', 'weapon', 'gun', 'knife', 'bomb', 'explosive',
      
      // Discriminatory language
      'racist', 'sexist', 'discrimination', 'prejudice', 'bias',
      
      // Inappropriate for family platform
      'gambling', 'casino', 'bet', 'betting', 'gamble'
    ];

    // Patterns that might indicate inappropriate content
    this.suspiciousPatterns = [
      /\b(go\s+to\s+hell)\b/gi,
      /\b(shut\s+up)\b/gi,
      /\b(f\*+k|f\*ck|f\*\*k)\b/gi,
      /\b(s\*+t|sh\*t|s\*\*t)\b/gi,
      /\b(b\*+ch|b\*tch)\b/gi,
      /\b(a\*+hole|a\*\*hole)\b/gi,
      /\b(d\*+n|d\*mn)\b/gi,
      /\b(h\*+l|h\*ll)\b/gi,
      /\b(cr\*p|cr\*\*)\b/gi,
      /\b(i\s+hate\s+you)\b/gi,
      /\b(you\s+suck)\b/gi,
      /\b(go\s+die)\b/gi,
      /\b(kill\s+yourself)\b/gi,
      /\b(nobody\s+likes\s+you)\b/gi,
      /\b(you\s+are\s+stupid)\b/gi,
      /\b(you\s+are\s+dumb)\b/gi,
      /\b(loser)\b/gi,
      /\b(contact\s+me\s+at)\b/gi,
      /\b(email\s+me)\b/gi,
      /\b(call\s+me)\b/gi,
      /\b(meet\s+me)\b/gi,
      /\b(come\s+over)\b/gi,
      /\b(send\s+me)\b/gi,
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g, // Phone numbers
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, // Email addresses
      /(https?:\/\/[^\s]+)/g, // URLs
      /\b(discord|snapchat|instagram|tiktok|facebook|whatsapp|telegram)\b/gi, // Social media
      /\b(free\s+money|easy\s+money|get\s+rich)\b/gi,
      /\b(click\s+here|visit\s+now|limited\s+time)\b/gi,
      /(.)\1{4,}/g // Repeated characters (like !!!! or ????)
    ];

    // Words that are always blocked regardless of context
    this.blockedWords = [
      'damn', 'hell', 'stupid', 'idiot', 'moron', 'dumb', 'loser',
      'hate', 'kill', 'die', 'murder', 'violence', 'hurt', 'evil',
      'devil', 'satan', 'sex', 'porn', 'nude', 'naked', 'drug',
      'drugs', 'alcohol', 'drunk', 'weed', 'threat', 'bully',
      'weapon', 'gun', 'knife', 'bomb'
    ];

    // Positive words that are encouraged
    this.positiveWords = [
      'love', 'peace', 'joy', 'hope', 'faith', 'blessed', 'grateful',
      'thankful', 'amazing', 'awesome', 'wonderful', 'beautiful',
      'inspiring', 'uplifting', 'encouraging', 'positive', 'good',
      'great', 'excellent', 'fantastic', 'incredible', 'outstanding'
    ];

    this.moderationLog = [];
  }

  /**
   * Main content checking function
   * @param {string} content - Content to check
   * @param {string} type - Type of content (video, profile, search, etc.)
   * @returns {Object} - Moderation result
   */
  checkContent(content, type = 'general') {
    if (!content || typeof content !== 'string') {
      return {
        isAppropriate: false,
        issues: ['Content cannot be empty'],
        severity: 'error',
        suggestions: ['Please provide valid content']
      };
    }

    const cleanContent = content.trim().toLowerCase();
    const result = {
      isAppropriate: true,
      issues: [],
      severity: 'none',
      suggestions: [],
      blockedWords: [],
      suspiciousPatterns: []
    };

    // Check for blocked words
    const foundBlockedWords = this.findBlockedWords(cleanContent);
    if (foundBlockedWords.length > 0) {
      result.isAppropriate = false;
      result.issues.push('Content contains inappropriate language');
      result.severity = 'high';
      result.blockedWords = foundBlockedWords;
      result.suggestions.push('Please use family-friendly language');
    }

    // Check for suspicious patterns
    const foundPatterns = this.findSuspiciousPatterns(content);
    if (foundPatterns.length > 0) {
      result.isAppropriate = false;
      result.issues.push('Content contains inappropriate patterns');
      result.severity = result.severity === 'high' ? 'high' : 'medium';
      result.suspiciousPatterns = foundPatterns;
      result.suggestions.push('Please avoid inappropriate expressions');
    }

    // Check for excessive caps (shouting)
    if (this.hasExcessiveCaps(content)) {
      result.issues.push('Excessive use of capital letters');
      result.severity = result.severity === 'none' ? 'low' : result.severity;
      result.suggestions.push('Please avoid writing in ALL CAPS');
    }

    // Check content length based on type
    const lengthCheck = this.checkContentLength(content, type);
    if (!lengthCheck.isValid) {
      result.isAppropriate = false;
      result.issues.push(lengthCheck.message);
      result.severity = 'medium';
      result.suggestions.push(lengthCheck.suggestion);
    }

    // Log moderation attempt
    this.logModerationAttempt(content, type, result);

    return result;
  }

  /**
   * Find blocked words in content
   */
  findBlockedWords(content) {
    const found = [];
    this.blockedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(content)) {
        found.push(word);
      }
    });
    return found;
  }

  /**
   * Find suspicious patterns in content
   */
  findSuspiciousPatterns(content) {
    const found = [];
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        found.push(pattern.source);
      }
    });
    return found;
  }

  /**
   * Check for excessive capital letters
   */
  hasExcessiveCaps(content) {
    if (content.length < 10) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const capsRatio = capsCount / content.length;
    return capsRatio > 0.6; // More than 60% caps
  }

  /**
   * Check content length based on type
   */
  checkContentLength(content, type) {
    const limits = {
      'video-title': { min: 3, max: 100 },
      'video-description': { min: 10, max: 2000 },
      'channel-name': { min: 3, max: 30 },
      'channel-handle': { min: 3, max: 20 },
      'search': { min: 1, max: 100 },
      'general': { min: 1, max: 500 }
    };

    const limit = limits[type] || limits.general;
    
    if (content.length < limit.min) {
      return {
        isValid: false,
        message: `Content is too short (minimum ${limit.min} characters)`,
        suggestion: `Please provide at least ${limit.min} characters`
      };
    }

    if (content.length > limit.max) {
      return {
        isValid: false,
        message: `Content is too long (maximum ${limit.max} characters)`,
        suggestion: `Please keep content under ${limit.max} characters`
      };
    }

    return { isValid: true };
  }

  /**
   * Generate suggestions for better content
   */
  generateSuggestions(content, type) {
    const suggestions = [];

    // Check if content has positive words
    const hasPositiveWords = this.positiveWords.some(word => 
      content.toLowerCase().includes(word)
    );

    if (!hasPositiveWords && type === 'video-description') {
      suggestions.push('Consider adding positive and inspiring words to your description');
    }

    // Type-specific suggestions
    switch (type) {
      case 'video-title':
        suggestions.push('Use clear, descriptive titles that accurately represent your content');
        break;
      case 'video-description':
        suggestions.push('Describe what viewers will learn or enjoy from your video');
        break;
      case 'channel-name':
        suggestions.push('Choose a name that reflects your content and values');
        break;
    }

    return suggestions;
  }

  /**
   * Log moderation attempts for review
   */
  logModerationAttempt(content, type, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      content: content.substring(0, 100), // First 100 chars only
      type: type,
      result: result,
      userAgent: navigator.userAgent
    };

    this.moderationLog.push(logEntry);

    // Keep only last 100 entries
    if (this.moderationLog.length > 100) {
      this.moderationLog = this.moderationLog.slice(-100);
    }

    // Store in localStorage for review
    try {
      localStorage.setItem('jonahTube_moderationLog', JSON.stringify(this.moderationLog));
    } catch (e) {
      console.warn('Could not save moderation log:', e);
    }
  }

  /**
   * Get moderation statistics
   */
  getModerationStats() {
    const stats = {
      totalChecks: this.moderationLog.length,
      blocked: this.moderationLog.filter(log => !log.result.isAppropriate).length,
      approved: this.moderationLog.filter(log => log.result.isAppropriate).length,
      mostCommonIssues: {},
      recentActivity: this.moderationLog.slice(-10)
    };

    // Count common issues
    this.moderationLog.forEach(log => {
      log.result.issues.forEach(issue => {
        stats.mostCommonIssues[issue] = (stats.mostCommonIssues[issue] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Clean/suggest alternative content
   */
  suggestCleanContent(content) {
    let cleanContent = content;

    // Replace blocked words with alternatives
    const replacements = {
      'stupid': 'silly',
      'idiot': 'person',
      'moron': 'person',
      'dumb': 'silly',
      'hate': 'dislike',
      'kill': 'stop',
      'die': 'end',
      'hell': 'heck',
      'damn': 'darn'
    };

    Object.keys(replacements).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanContent = cleanContent.replace(regex, replacements[word]);
    });

    // Remove excessive punctuation
    cleanContent = cleanContent.replace(/[!?]{3,}/g, '!');
    cleanContent = cleanContent.replace(/\.{3,}/g, '...');

    // Normalize caps
    if (this.hasExcessiveCaps(cleanContent)) {
      cleanContent = cleanContent.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return cleanContent.trim();
  }

  /**
   * Check if content is family-friendly
   */
  isFamilyFriendly(content) {
    const result = this.checkContent(content);
    return result.isAppropriate && result.severity !== 'high';
  }

  /**
   * Get content safety score (0-100)
   */
  getContentSafetyScore(content) {
    const result = this.checkContent(content);
    
    if (!result.isAppropriate) {
      if (result.severity === 'high') return 0;
      if (result.severity === 'medium') return 30;
      if (result.severity === 'low') return 60;
    }

    let score = 100;

    // Deduct points for issues
    score -= result.issues.length * 10;

    // Add points for positive words
    const positiveCount = this.positiveWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    score += Math.min(positiveCount * 5, 20);

    return Math.max(0, Math.min(100, score));
  }
}

// Create global instance
window.ContentModeration = new ContentModerationSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentModerationSystem;
}
