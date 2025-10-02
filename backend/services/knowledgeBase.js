const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

class KnowledgeBase {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // In-memory knowledge store (in production, use a proper vector database)
    this.knowledge = new Map();
    this.embeddings = new Map();
    this.categories = new Map();
    this.searchIndex = new Map();
    
    // Domain-specific knowledge bases
    this.domains = {
      programming: new Map(),
      science: new Map(),
      business: new Map(),
      general: new Map()
    };

    // Knowledge quality metrics
    this.qualityMetrics = new Map();
    
    this.initializeKnowledgeBase();
    this.logger.info('📚 Knowledge Base initialized with advanced search capabilities');
  }

  async initializeKnowledgeBase() {
    try {
      // Load core knowledge from files
      await this.loadCoreKnowledge();
      
      // Build search indices
      await this.buildSearchIndices();
      
      // Initialize domain-specific knowledge
      await this.initializeDomainKnowledge();
      
      this.logger.info(`Knowledge base loaded with ${this.knowledge.size} entries`);
    } catch (error) {
      this.logger.error('Failed to initialize knowledge base:', error);
    }
  }

  async loadCoreKnowledge() {
    // Programming knowledge
    await this.addKnowledge('programming-fundamentals', {
      title: 'Programming Fundamentals',
      content: `
        Programming is the process of creating instructions for computers to execute.
        Key concepts include:
        - Variables: Store data values
        - Functions: Reusable blocks of code
        - Control structures: if/else, loops, switches
        - Data structures: Arrays, objects, lists
        - Algorithms: Step-by-step problem-solving procedures
        - Debugging: Finding and fixing errors in code
        - Testing: Verifying code works as expected
      `,
      domain: 'programming',
      tags: ['basics', 'fundamentals', 'concepts'],
      quality: 0.95,
      lastUpdated: new Date()
    });

    await this.addKnowledge('javascript-best-practices', {
      title: 'JavaScript Best Practices',
      content: `
        JavaScript best practices for clean, maintainable code:
        - Use const/let instead of var
        - Write descriptive variable names
        - Keep functions small and focused
        - Use async/await for asynchronous operations
        - Handle errors properly with try/catch
        - Use strict mode ('use strict')
        - Avoid global variables
        - Use meaningful comments
        - Follow consistent code formatting
        - Use ESLint for code quality
      `,
      domain: 'programming',
      tags: ['javascript', 'best-practices', 'clean-code'],
      quality: 0.92,
      lastUpdated: new Date()
    });

    // Science knowledge
    await this.addKnowledge('scientific-method', {
      title: 'The Scientific Method',
      content: `
        The scientific method is a systematic approach to understanding the natural world:
        1. Observation: Notice phenomena in the world
        2. Question: Ask specific questions about observations
        3. Hypothesis: Propose testable explanations
        4. Prediction: Make specific predictions based on hypothesis
        5. Experiment: Design and conduct controlled tests
        6. Analysis: Examine data and draw conclusions
        7. Peer Review: Share findings with scientific community
        8. Replication: Verify results through repeated experiments
      `,
      domain: 'science',
      tags: ['methodology', 'research', 'experiments'],
      quality: 0.98,
      lastUpdated: new Date()
    });

    // Business knowledge
    await this.addKnowledge('business-strategy-basics', {
      title: 'Business Strategy Fundamentals',
      content: `
        Business strategy involves planning and decision-making for competitive advantage:
        - Market Analysis: Understanding customers, competitors, and trends
        - Value Proposition: Unique benefits offered to customers
        - Competitive Advantage: Sustainable differentiation from competitors
        - Resource Allocation: Optimizing use of time, money, and talent
        - Risk Management: Identifying and mitigating potential threats
        - Performance Metrics: KPIs to measure success and progress
        - Strategic Planning: Long-term vision and roadmap
        - Innovation: Continuous improvement and adaptation
      `,
      domain: 'business',
      tags: ['strategy', 'planning', 'competitive-advantage'],
      quality: 0.89,
      lastUpdated: new Date()
    });

    // AI and Technology knowledge
    await this.addKnowledge('ai-fundamentals', {
      title: 'Artificial Intelligence Fundamentals',
      content: `
        Artificial Intelligence encompasses various approaches to creating intelligent systems:
        - Machine Learning: Algorithms that learn from data
        - Deep Learning: Neural networks with multiple layers
        - Natural Language Processing: Understanding and generating human language
        - Computer Vision: Interpreting and analyzing visual information
        - Reinforcement Learning: Learning through interaction and feedback
        - Expert Systems: Rule-based decision-making systems
        - Robotics: Physical AI systems that interact with the world
        - Ethics: Responsible development and deployment of AI systems
      `,
      domain: 'technology',
      tags: ['ai', 'machine-learning', 'technology'],
      quality: 0.94,
      lastUpdated: new Date()
    });
  }

  async addKnowledge(id, knowledgeItem) {
    // Validate knowledge item
    if (!this.validateKnowledgeItem(knowledgeItem)) {
      throw new Error('Invalid knowledge item structure');
    }

    // Generate embeddings for search (simplified - in production use proper embeddings)
    const embedding = this.generateEmbedding(knowledgeItem.content);
    
    // Store knowledge
    this.knowledge.set(id, {
      id,
      ...knowledgeItem,
      createdAt: new Date(),
      accessCount: 0
    });

    // Store embedding
    this.embeddings.set(id, embedding);

    // Update domain-specific storage
    if (knowledgeItem.domain && this.domains[knowledgeItem.domain]) {
      this.domains[knowledgeItem.domain].set(id, knowledgeItem);
    }

    // Update search index
    this.updateSearchIndex(id, knowledgeItem);

    // Update quality metrics
    this.qualityMetrics.set(id, {
      quality: knowledgeItem.quality || 0.5,
      relevanceScore: 0,
      usageCount: 0,
      lastAccessed: new Date()
    });

    this.logger.info(`Added knowledge: ${id} to domain: ${knowledgeItem.domain}`);
  }

  validateKnowledgeItem(item) {
    return item && 
           typeof item.title === 'string' && 
           typeof item.content === 'string' &&
           item.title.length > 0 && 
           item.content.length > 0;
  }

  generateEmbedding(text) {
    // Simplified embedding generation (in production, use proper embedding models)
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const wordCounts = {};
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Create a simple vector representation
    const vocabulary = ['programming', 'code', 'function', 'data', 'algorithm', 'science', 'research', 'experiment', 'business', 'strategy', 'market', 'customer'];
    const vector = vocabulary.map(word => wordCounts[word] || 0);
    
    return vector;
  }

  updateSearchIndex(id, knowledgeItem) {
    // Create searchable terms
    const searchTerms = [
      ...knowledgeItem.title.toLowerCase().split(/\W+/),
      ...knowledgeItem.content.toLowerCase().split(/\W+/),
      ...(knowledgeItem.tags || [])
    ].filter(term => term.length > 2);

    // Update inverted index
    searchTerms.forEach(term => {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term).add(id);
    });
  }

  async buildSearchIndices() {
    // Build indices for fast retrieval
    this.searchIndex.clear();
    
    for (const [id, item] of this.knowledge.entries()) {
      this.updateSearchIndex(id, item);
    }

    this.logger.info(`Built search index with ${this.searchIndex.size} terms`);
  }

  async initializeDomainKnowledge() {
    // Initialize domain-specific knowledge patterns
    const domainPatterns = {
      programming: {
        keywords: ['code', 'function', 'variable', 'algorithm', 'debug', 'test'],
        concepts: ['abstraction', 'encapsulation', 'inheritance', 'polymorphism'],
        practices: ['clean code', 'testing', 'documentation', 'version control']
      },
      science: {
        keywords: ['hypothesis', 'experiment', 'data', 'analysis', 'theory'],
        concepts: ['causation', 'correlation', 'validity', 'reliability'],
        practices: ['peer review', 'replication', 'methodology', 'ethics']
      },
      business: {
        keywords: ['strategy', 'market', 'customer', 'revenue', 'profit'],
        concepts: ['value proposition', 'competitive advantage', 'market fit'],
        practices: ['planning', 'analysis', 'execution', 'measurement']
      }
    };

    // Store domain patterns for enhanced search and reasoning
    this.domainPatterns = domainPatterns;
  }

  async search({ query, domain, maxResults = 10, userContext = {} }) {
    const startTime = Date.now();
    
    try {
      // Step 1: Parse and analyze query
      const queryAnalysis = this.analyzeQuery(query);
      
      // Step 2: Get candidate results
      const candidates = await this.getCandidateResults(query, domain, queryAnalysis);
      
      // Step 3: Rank results by relevance
      const rankedResults = this.rankResults(candidates, query, queryAnalysis, userContext);
      
      // Step 4: Apply domain filtering if specified
      const filteredResults = domain ? 
        rankedResults.filter(r => r.domain === domain) : 
        rankedResults;
      
      // Step 5: Limit results and add metadata
      const finalResults = filteredResults.slice(0, maxResults).map(result => ({
        ...result,
        relevanceScore: result.score,
        accessCount: this.qualityMetrics.get(result.id)?.usageCount || 0
      }));

      // Update usage statistics
      finalResults.forEach(result => {
        const metrics = this.qualityMetrics.get(result.id);
        if (metrics) {
          metrics.usageCount++;
          metrics.lastAccessed = new Date();
        }
      });

      const queryTime = Date.now() - startTime;
      
      return {
        items: finalResults,
        total: candidates.length,
        queryTime,
        relevanceScores: finalResults.map(r => r.relevanceScore),
        queryAnalysis
      };

    } catch (error) {
      this.logger.error('Knowledge search error:', error);
      throw new Error('Failed to search knowledge base');
    }
  }

  analyzeQuery(query) {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\W+/).filter(w => w.length > 2);
    
    // Identify query type
    const queryTypes = {
      definition: ['what is', 'define', 'meaning of', 'explain'],
      howTo: ['how to', 'how do', 'steps to', 'guide'],
      comparison: ['vs', 'versus', 'compare', 'difference'],
      troubleshooting: ['error', 'problem', 'issue', 'fix', 'debug'],
      bestPractice: ['best practice', 'recommended', 'should', 'better way']
    };

    let queryType = 'general';
    for (const [type, patterns] of Object.entries(queryTypes)) {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        queryType = type;
        break;
      }
    }

    // Identify domain hints
    const domainHints = [];
    for (const [domain, patterns] of Object.entries(this.domainPatterns)) {
      const matches = patterns.keywords.filter(keyword => lowerQuery.includes(keyword));
      if (matches.length > 0) {
        domainHints.push({ domain, matches, score: matches.length });
      }
    }

    return {
      originalQuery: query,
      words,
      queryType,
      domainHints: domainHints.sort((a, b) => b.score - a.score),
      complexity: this.assessQueryComplexity(query)
    };
  }

  assessQueryComplexity(query) {
    const wordCount = query.split(/\s+/).length;
    const hasMultipleConcepts = query.includes(' and ') || query.includes(' or ');
    const hasSpecificTerms = /\b(specific|detailed|comprehensive|advanced)\b/i.test(query);
    
    if (wordCount > 10 || hasMultipleConcepts || hasSpecificTerms) {
      return 'high';
    } else if (wordCount > 5) {
      return 'medium';
    }
    return 'low';
  }

  async getCandidateResults(query, domain, queryAnalysis) {
    const candidates = new Set();
    
    // Method 1: Keyword search
    const keywordResults = this.searchByKeywords(queryAnalysis.words);
    keywordResults.forEach(id => candidates.add(id));
    
    // Method 2: Semantic search (simplified)
    const semanticResults = this.searchBySemantic(query);
    semanticResults.forEach(id => candidates.add(id));
    
    // Method 3: Domain-specific search
    if (domain && this.domains[domain]) {
      for (const id of this.domains[domain].keys()) {
        candidates.add(id);
      }
    }

    // Convert to result objects
    return Array.from(candidates)
      .map(id => this.knowledge.get(id))
      .filter(item => item !== undefined);
  }

  searchByKeywords(words) {
    const results = new Set();
    
    words.forEach(word => {
      const ids = this.searchIndex.get(word);
      if (ids) {
        ids.forEach(id => results.add(id));
      }
    });
    
    return Array.from(results);
  }

  searchBySemantic(query) {
    // Simplified semantic search using embeddings
    const queryEmbedding = this.generateEmbedding(query);
    const similarities = [];
    
    for (const [id, embedding] of this.embeddings.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      if (similarity > 0.1) { // Threshold for relevance
        similarities.push({ id, similarity });
      }
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20) // Top 20 semantic matches
      .map(item => item.id);
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  rankResults(candidates, query, queryAnalysis, userContext) {
    return candidates.map(item => {
      const score = this.calculateRelevanceScore(item, query, queryAnalysis, userContext);
      return { ...item, score };
    }).sort((a, b) => b.score - a.score);
  }

  calculateRelevanceScore(item, query, queryAnalysis, userContext) {
    let score = 0;
    
    // Title relevance (high weight)
    const titleMatches = this.countMatches(item.title.toLowerCase(), queryAnalysis.words);
    score += titleMatches * 3;
    
    // Content relevance (medium weight)
    const contentMatches = this.countMatches(item.content.toLowerCase(), queryAnalysis.words);
    score += contentMatches * 1;
    
    // Tag relevance (high weight)
    if (item.tags) {
      const tagMatches = item.tags.filter(tag => 
        queryAnalysis.words.some(word => tag.includes(word))
      ).length;
      score += tagMatches * 2;
    }
    
    // Domain relevance
    if (queryAnalysis.domainHints.length > 0) {
      const topDomain = queryAnalysis.domainHints[0];
      if (item.domain === topDomain.domain) {
        score += 2;
      }
    }
    
    // Quality score
    const qualityMetrics = this.qualityMetrics.get(item.id);
    if (qualityMetrics) {
      score += qualityMetrics.quality * 1;
    }
    
    // Recency bonus
    const daysSinceUpdate = (Date.now() - new Date(item.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      score += 0.5;
    }
    
    // User context relevance
    if (userContext.expertise && item.tags) {
      const expertiseMatch = item.tags.includes(userContext.expertise);
      if (expertiseMatch) score += 1;
    }
    
    return score;
  }

  countMatches(text, words) {
    return words.reduce((count, word) => {
      const regex = new RegExp(word, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  async addUserKnowledge(userId, knowledgeItem) {
    const id = `user_${userId}_${uuidv4()}`;
    
    await this.addKnowledge(id, {
      ...knowledgeItem,
      source: 'user',
      userId,
      quality: 0.7 // User-generated content starts with lower quality score
    });
    
    return id;
  }

  async updateKnowledge(id, updates) {
    const existing = this.knowledge.get(id);
    if (!existing) {
      throw new Error(`Knowledge item ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      lastUpdated: new Date()
    };
    
    // Re-validate
    if (!this.validateKnowledgeItem(updated)) {
      throw new Error('Invalid knowledge item structure');
    }
    
    // Update storage
    this.knowledge.set(id, updated);
    
    // Update embedding if content changed
    if (updates.content) {
      const embedding = this.generateEmbedding(updated.content);
      this.embeddings.set(id, embedding);
    }
    
    // Update search index
    this.updateSearchIndex(id, updated);
    
    this.logger.info(`Updated knowledge: ${id}`);
    return updated;
  }

  async deleteKnowledge(id) {
    if (!this.knowledge.has(id)) {
      throw new Error(`Knowledge item ${id} not found`);
    }
    
    // Remove from all storage
    this.knowledge.delete(id);
    this.embeddings.delete(id);
    this.qualityMetrics.delete(id);
    
    // Remove from domain storage
    for (const domain of Object.values(this.domains)) {
      domain.delete(id);
    }
    
    // Rebuild search index (simplified approach)
    await this.buildSearchIndices();
    
    this.logger.info(`Deleted knowledge: ${id}`);
  }

  async getKnowledgeStats() {
    const stats = {
      totalItems: this.knowledge.size,
      domainDistribution: {},
      qualityDistribution: { high: 0, medium: 0, low: 0 },
      recentlyAdded: 0,
      mostAccessed: []
    };
    
    // Calculate domain distribution
    for (const item of this.knowledge.values()) {
      const domain = item.domain || 'unknown';
      stats.domainDistribution[domain] = (stats.domainDistribution[domain] || 0) + 1;
    }
    
    // Calculate quality distribution
    for (const metrics of this.qualityMetrics.values()) {
      if (metrics.quality >= 0.8) stats.qualityDistribution.high++;
      else if (metrics.quality >= 0.5) stats.qualityDistribution.medium++;
      else stats.qualityDistribution.low++;
    }
    
    // Recently added (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const item of this.knowledge.values()) {
      if (new Date(item.createdAt) > weekAgo) {
        stats.recentlyAdded++;
      }
    }
    
    // Most accessed
    const accessList = Array.from(this.qualityMetrics.entries())
      .map(([id, metrics]) => ({ id, usageCount: metrics.usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
    
    stats.mostAccessed = accessList;
    
    return stats;
  }

  async exportKnowledge(domain = null) {
    const items = domain ? 
      Array.from(this.domains[domain]?.values() || []) :
      Array.from(this.knowledge.values());
    
    return {
      exportDate: new Date().toISOString(),
      domain,
      itemCount: items.length,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        domain: item.domain,
        tags: item.tags,
        quality: item.quality,
        createdAt: item.createdAt,
        lastUpdated: item.lastUpdated
      }))
    };
  }

  async importKnowledge(knowledgeData) {
    let imported = 0;
    let errors = [];
    
    for (const item of knowledgeData.items) {
      try {
        await this.addKnowledge(item.id || uuidv4(), item);
        imported++;
      } catch (error) {
        errors.push({ item: item.id || item.title, error: error.message });
      }
    }
    
    return {
      imported,
      errors,
      total: knowledgeData.items.length
    };
  }

  isHealthy() {
    return {
      status: 'healthy',
      knowledgeItems: this.knowledge.size,
      searchTerms: this.searchIndex.size,
      domains: Object.keys(this.domains).length,
      embeddings: this.embeddings.size,
      lastUpdate: new Date().toISOString()
    };
  }
}

module.exports = KnowledgeBase;

