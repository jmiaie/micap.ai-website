// Lead Scoring Algorithm
// Calculates lead quality score based on ROI calculator inputs and engagement metrics

class LeadScoringEngine {
  constructor() {
    this.industryWeights = {
      'Finance': 1.2,
      'Insurance': 1.2,
      'Technology': 1.1,
      'Professional Services': 1.1,
      'Logistics': 1.0,
      'Manufacturing': 1.0,
      'Marketing': 0.95,
      'Healthcare': 0.9,
      'Retail': 0.85,
      'Construction': 0.85,
      'Legal': 0.9,
      'Real Estate': 0.8,
      'Education': 0.7,
      'Hospitality': 0.7,
      'Other': 0.75
    };

    this.companySizeWeights = {
      'small': 0.7,      // 1-50 employees
      'medium': 1.0,     // 51-500 employees
      'large': 1.2,      // 501-2000 employees
      'enterprise': 1.3  // 2000+ employees
    };
  }

  // Determine company size category
  getCompanySizeCategory(headcount) {
    const count = parseInt(headcount) || 0;
    if (count <= 50) return 'small';
    if (count <= 500) return 'medium';
    if (count <= 2000) return 'large';
    return 'enterprise';
  }

  // Calculate base score from ROI metrics
  calculateROIScore(roiPercentage, paybackMonths) {
    let score = 0;
    
    // ROI scoring (0-30 points)
    if (roiPercentage >= 300) score += 30;
    else if (roiPercentage >= 200) score += 25;
    else if (roiPercentage >= 150) score += 20;
    else if (roiPercentage >= 100) score += 15;
    else if (roiPercentage >= 50) score += 10;
    else score += 5;

    // Payback period scoring (0-20 points)
    if (paybackMonths <= 6) score += 20;
    else if (paybackMonths <= 9) score += 15;
    else if (paybackMonths <= 12) score += 12;
    else if (paybackMonths <= 18) score += 8;
    else score += 4;

    return score;
  }

  // Calculate engagement score
  calculateEngagementScore(lead) {
    let score = 0;

    // Document uploads (0-15 points)
    if (lead.uploadedFiles && lead.uploadedFiles.length > 0) {
      score += Math.min(15, lead.uploadedFiles.length * 5);
    }

    // Additional comments (0-10 points)
    if (lead.additionalComments && lead.additionalComments.trim().length > 50) {
      score += 10;
    } else if (lead.additionalComments && lead.additionalComments.trim().length > 0) {
      score += 5;
    }

    // Survey completion (0-15 points)
    if (lead.businessGoals && lead.businessGoals.length > 0) {
      score += Math.min(15, lead.businessGoals.length * 5);
    }

    // High automation level (0-10 points)
    const automationLevel = parseInt(lead.automationLevel) || 0;
    if (automationLevel >= 70) score += 10;
    else if (automationLevel >= 50) score += 7;
    else if (automationLevel >= 30) score += 4;

    return score;
  }

  // Calculate company profile score
  calculateCompanyScore(lead) {
    let score = 0;

    // Industry weight (0-20 points)
    const industryWeight = this.industryWeights[lead.industry] || 0.75;
    score += industryWeight * 20;

    // Company size (0-15 points)
    const sizeCategory = this.getCompanySizeCategory(lead.headcount);
    const sizeWeight = this.companySizeWeights[sizeCategory];
    score += sizeWeight * 15;

    // Revenue size (0-10 points)
    const revenue = parseInt(lead.revenue) || 0;
    if (revenue >= 10000000) score += 10;
    else if (revenue >= 5000000) score += 8;
    else if (revenue >= 1000000) score += 6;
    else if (revenue >= 500000) score += 4;
    else score += 2;

    return score;
  }

  // Calculate total lead score (0-100)
  calculateLeadScore(lead) {
    // Calculate ROI score (estimated from labor cost)
    const hourlyRate = parseFloat(lead.laborRate) || 0;
    const monthlyHours = lead.laborPeriod === 'month' ? parseFloat(lead.laborHours) : parseFloat(lead.laborHours) * 4.33;
    const monthlyLaborCost = hourlyRate * monthlyHours;
    const annualLaborCost = monthlyLaborCost * 12;
    const implementationCost = (parseInt(lead.headcount) || 1) * 5000;
    const automationLevel = parseInt(lead.automationLevel) || 30;
    const savings = annualLaborCost * (automationLevel / 100);
    const roi = ((savings - implementationCost) / implementationCost) * 100;
    const payback = Math.max(1, Math.round((implementationCost / (savings / 12))));

    const roiScore = this.calculateROIScore(roi, payback);
    const engagementScore = this.calculateEngagementScore(lead);
    const companyScore = this.calculateCompanyScore(lead);

    // Total score: ROI (40%) + Engagement (30%) + Company (30%)
    const totalScore = (roiScore * 0.4) + (engagementScore * 0.3) + (companyScore * 0.3);

    return {
      totalScore: Math.round(totalScore),
      roiScore: Math.round(roiScore),
      engagementScore: Math.round(engagementScore),
      companyScore: Math.round(companyScore),
      roi: Math.round(roi),
      payback,
      savings: Math.round(savings),
      sizeCategory: this.getCompanySizeCategory(lead.headcount),
      industryWeight: this.industryWeights[lead.industry] || 0.75
    };
  }

  // Get lead priority (Hot, Warm, Cool)
  getLeadPriority(score) {
    if (score >= 75) return 'Hot';
    if (score >= 50) return 'Warm';
    return 'Cool';
  }

  // Get lead status color
  getScoreColor(score) {
    if (score >= 75) return '#34D399'; // Green - Hot
    if (score >= 50) return '#FBBF24'; // Amber - Warm
    return '#EF4444'; // Red - Cool
  }

  // Batch score multiple leads
  scoreLeads(leads) {
    return leads.map(lead => ({
      ...lead,
      scoring: this.calculateLeadScore(lead),
      priority: this.getLeadPriority(this.calculateLeadScore(lead).totalScore),
      scoreColor: this.getScoreColor(this.calculateLeadScore(lead).totalScore)
    }));
  }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeadScoringEngine;
}
