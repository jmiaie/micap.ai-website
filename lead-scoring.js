/**
 * Lead Scoring System
 * Tracks conversion rates, engagement metrics, and ROI by industry and use case
 */

class LeadScoringSystem {
  constructor() {
    this.leads = new Map(); // leadId -> lead data
    this.industryMetrics = new Map(); // industry -> metrics
    this.useCaseMetrics = new Map(); // useCase -> metrics
    this.conversionFunnel = {
      visited: 0,
      verified: 0,
      completed: 0,
      converted: 0
    };
    this.timeSeriesData = []; // Track metrics over time
  }

  /**
   * Record a lead visiting the calculator
   */
  recordVisit(sessionId, industry, companySize) {
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const lead = {
      id: leadId,
      sessionId,
      industry,
      companySize,
      visitedAt: new Date(),
      status: 'visited', // visited -> verified -> completed -> converted
      verifiedAt: null,
      completedAt: null,
      convertedAt: null,
      useCasesViewed: [],
      timeOnSite: 0,
      engagementScore: 0
    };

    this.leads.set(leadId, lead);
    this.conversionFunnel.visited++;
    this._updateIndustryMetrics(industry, 'visited');

    return leadId;
  }

  /**
   * Record a lead completing email/phone verification
   */
  recordVerification(leadId, email, phone) {
    const lead = this.leads.get(leadId);
    if (!lead) return false;

    lead.status = 'verified';
    lead.verifiedAt = new Date();
    lead.email = email;
    lead.phone = phone;
    lead.timeOnSite = Math.round((lead.verifiedAt - lead.visitedAt) / 1000); // seconds

    this.conversionFunnel.verified++;
    this._updateIndustryMetrics(lead.industry, 'verified');

    return true;
  }

  /**
   * Record a lead completing the ROI analysis
   */
  recordCompletion(leadId, useCases, roiData) {
    const lead = this.leads.get(leadId);
    if (!lead) return false;

    lead.status = 'completed';
    lead.completedAt = new Date();
    lead.useCasesViewed = useCases.map(uc => uc.title);
    lead.roiData = roiData;
    lead.engagementScore = this._calculateEngagementScore(lead);

    this.conversionFunnel.completed++;
    this._updateIndustryMetrics(lead.industry, 'completed');

    // Track use case engagement
    useCases.forEach(useCase => {
      this._updateUseCaseMetrics(useCase.title, 'viewed');
    });

    return true;
  }

  /**
   * Record a lead converting (downloading report, booking call, etc)
   */
  recordConversion(leadId, conversionType = 'download') {
    const lead = this.leads.get(leadId);
    if (!lead) return false;

    lead.status = 'converted';
    lead.convertedAt = new Date();
    lead.conversionType = conversionType;

    this.conversionFunnel.converted++;
    this._updateIndustryMetrics(lead.industry, 'converted');

    // Track use case conversions
    lead.useCasesViewed.forEach(useCase => {
      this._updateUseCaseMetrics(useCase, 'converted');
    });

    return true;
  }

  /**
   * Update industry metrics
   */
  _updateIndustryMetrics(industry, stage) {
    if (!this.industryMetrics.has(industry)) {
      this.industryMetrics.set(industry, {
        industry,
        visited: 0,
        verified: 0,
        completed: 0,
        converted: 0,
        avgEngagementScore: 0,
        avgTimeOnSite: 0,
        totalLeads: 0,
        conversionRate: 0,
        verificationRate: 0,
        completionRate: 0
      });
    }

    const metrics = this.industryMetrics.get(industry);
    metrics[stage]++;
    metrics.totalLeads = metrics.visited;
    this._calculateConversionRates(metrics);
  }

  /**
   * Update use case metrics
   */
  _updateUseCaseMetrics(useCase, stage) {
    if (!this.useCaseMetrics.has(useCase)) {
      this.useCaseMetrics.set(useCase, {
        useCase,
        viewed: 0,
        converted: 0,
        conversionRate: 0,
        engagementCount: 0
      });
    }

    const metrics = this.useCaseMetrics.get(useCase);
    metrics[stage]++;
    if (metrics.viewed > 0) {
      metrics.conversionRate = Math.round((metrics.converted / metrics.viewed) * 100);
    }
  }

  /**
   * Calculate conversion rates for industry
   */
  _calculateConversionRates(metrics) {
    if (metrics.visited > 0) {
      metrics.verificationRate = Math.round((metrics.verified / metrics.visited) * 100);
      metrics.completionRate = Math.round((metrics.completed / metrics.visited) * 100);
      metrics.conversionRate = Math.round((metrics.converted / metrics.visited) * 100);
    }
  }

  /**
   * Calculate engagement score (0-100)
   */
  _calculateEngagementScore(lead) {
    let score = 0;

    // Time on site (max 30 points)
    if (lead.timeOnSite > 300) score += 30; // 5+ minutes
    else if (lead.timeOnSite > 180) score += 20; // 3+ minutes
    else if (lead.timeOnSite > 60) score += 10; // 1+ minute

    // Use cases viewed (max 40 points)
    const useCaseCount = lead.useCasesViewed ? lead.useCasesViewed.length : 0;
    score += Math.min(40, useCaseCount * 13); // 3 use cases = 40 points

    // ROI data completeness (max 30 points)
    if (lead.roiData) {
      if (lead.roiData.roi > 200) score += 30; // High ROI
      else if (lead.roiData.roi > 100) score += 20;
      else score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Get industry metrics sorted by conversion rate
   */
  getIndustryMetricsSorted() {
    return Array.from(this.industryMetrics.values())
      .sort((a, b) => b.conversionRate - a.conversionRate);
  }

  /**
   * Get use case metrics sorted by conversion rate
   */
  getUseCaseMetricsSorted() {
    return Array.from(this.useCaseMetrics.values())
      .sort((a, b) => b.conversionRate - a.conversionRate);
  }

  /**
   * Get conversion funnel data
   */
  getConversionFunnel() {
    const funnel = { ...this.conversionFunnel };
    if (funnel.visited > 0) {
      funnel.verificationRate = Math.round((funnel.verified / funnel.visited) * 100);
      funnel.completionRate = Math.round((funnel.completed / funnel.visited) * 100);
      funnel.conversionRate = Math.round((funnel.converted / funnel.visited) * 100);
    }
    return funnel;
  }

  /**
   * Get high-value leads (engagement score > 70)
   */
  getHighValueLeads() {
    return Array.from(this.leads.values())
      .filter(lead => lead.engagementScore > 70)
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 20);
  }

  /**
   * Get leads by industry
   */
  getLeadsByIndustry(industry) {
    return Array.from(this.leads.values())
      .filter(lead => lead.industry === industry);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const allLeads = Array.from(this.leads.values());
    const avgEngagementScore = allLeads.length > 0
      ? Math.round(allLeads.reduce((sum, l) => sum + (l.engagementScore || 0), 0) / allLeads.length)
      : 0;

    const avgTimeOnSite = allLeads.length > 0
      ? Math.round(allLeads.reduce((sum, l) => sum + (l.timeOnSite || 0), 0) / allLeads.length)
      : 0;

    const topIndustry = this.getIndustryMetricsSorted()[0];
    const topUseCase = this.getUseCaseMetricsSorted()[0];

    return {
      totalLeads: allLeads.length,
      avgEngagementScore,
      avgTimeOnSite,
      topIndustry: topIndustry ? topIndustry.industry : 'N/A',
      topIndustryConversionRate: topIndustry ? topIndustry.conversionRate : 0,
      topUseCase: topUseCase ? topUseCase.useCase : 'N/A',
      topUseCaseConversionRate: topUseCase ? topUseCase.conversionRate : 0,
      conversionFunnel: this.getConversionFunnel()
    };
  }

  /**
   * Export all metrics as JSON
   */
  exportMetrics() {
    return {
      summary: this.getSummary(),
      industryMetrics: this.getIndustryMetricsSorted(),
      useCaseMetrics: this.getUseCaseMetricsSorted(),
      conversionFunnel: this.getConversionFunnel(),
      highValueLeads: this.getHighValueLeads(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get leads for a specific date range
   */
  getLeadsByDateRange(startDate, endDate) {
    return Array.from(this.leads.values())
      .filter(lead => {
        const visitDate = new Date(lead.visitedAt);
        return visitDate >= startDate && visitDate <= endDate;
      });
  }
}

module.exports = LeadScoringSystem;
