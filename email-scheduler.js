/**
 * Email Scheduler Module
 * Manages the 5-email nurture sequence for leads captured from ROI calculator
 * 
 * Sequence Timeline:
 * - Email 1: Day 0 (immediate)
 * - Email 2: Day 2
 * - Email 3: Day 5
 * - Email 4: Day 9
 * - Email 5: Day 14
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class EmailScheduler {
  constructor() {
    this.emailSequence = [
      {
        id: 1,
        name: 'Welcome + ROI Report',
        delayDays: 0,
        templateFile: 'email-template-1.html',
        subject: 'Your AI Automation ROI Report is Ready (+ 3 Quick Wins Inside)',
      },
      {
        id: 2,
        name: 'Hidden Opportunities',
        delayDays: 2,
        templateFile: 'email-template-2.html',
        subject: 'The ${{hiddenSavings}}K Opportunity You\'re Probably Missing',
      },
      {
        id: 3,
        name: 'Case Study + Social Proof',
        delayDays: 5,
        templateFile: 'email-template-3.html',
        subject: 'How {{caseStudyCompanyType}} Achieved {{caseStudyROI}}% ROI in {{caseStudyTimeframe}}',
      },
      {
        id: 4,
        name: 'Objection Handling',
        delayDays: 9,
        templateFile: 'email-template-4.html',
        subject: '"But Will It Actually Work for Our Business?" (Common Concerns Answered)',
      },
      {
        id: 5,
        name: 'Final Push + Urgency',
        delayDays: 14,
        templateFile: 'email-template-5.html',
        subject: 'One Last Thing Before I Stop Following Up',
      },
    ];

    this.emailQueue = []; // In-memory queue (use database in production)
  }

  /**
   * Schedule the entire nurture sequence for a lead
   * @param {Object} lead - Lead data from ROI calculator
   * @param {string} lead.email - Lead email address
   * @param {string} lead.firstName - Lead first name
   * @param {string} lead.company - Company name
   * @param {string} lead.industry - Industry
   * @param {number} lead.roiMetrics - ROI metrics from calculator
   */
  scheduleNurtureSequence(lead) {
    logger.info('Scheduling nurture sequence', { email: lead.email, component: 'email-scheduler' });

    this.emailSequence.forEach((email) => {
      const scheduledTime = this.calculateScheduledTime(email.delayDays);
      
      const queueItem = {
        leadId: lead.id || lead.email,
        email: lead.email,
        emailSequenceId: email.id,
        emailName: email.name,
        templateFile: email.templateFile,
        subject: email.subject,
        scheduledTime: scheduledTime,
        status: 'scheduled',
        attempts: 0,
        maxAttempts: 3,
        leadData: lead,
        createdAt: new Date(),
      };

      this.emailQueue.push(queueItem);
      logger.info('Email scheduled', { email: lead.email, emailName: email.name, scheduledTime, component: 'email-scheduler' });
    });

    return {
      success: true,
      leadEmail: lead.email,
      emailsScheduled: this.emailSequence.length,
      message: `Nurture sequence scheduled for ${lead.email}`,
    };
  }

  /**
   * Calculate scheduled send time based on delay days
   * @param {number} delayDays - Days to delay
   * @returns {Date} Scheduled send time
   */
  calculateScheduledTime(delayDays) {
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);
    
    // Schedule for 9 AM on the target day
    scheduledTime.setHours(9, 0, 0, 0);
    
    return scheduledTime;
  }

  /**
   * Load email template and personalize with lead data
   * @param {string} templateFile - Template filename
   * @param {Object} leadData - Lead data for personalization
   * @returns {string} Personalized email HTML
   */
  personalizeTemplate(templateFile, leadData) {
    try {
      const templatePath = path.join(__dirname, templateFile);
      let template = fs.readFileSync(templatePath, 'utf8');

      // Replace all template variables with lead data
      template = template.replace(/{{firstName}}/g, leadData.firstName || 'there');
      template = template.replace(/{{lastName}}/g, leadData.lastName || '');
      template = template.replace(/{{email}}/g, leadData.email || '');
      template = template.replace(/{{company}}/g, leadData.company || '');
      template = template.replace(/{{industry}}/g, leadData.industry || '');
      template = template.replace(/{{senderName}}/g, 'James Milam');

      // ROI-specific variables
      if (leadData.roiMetrics) {
        template = template.replace(/{{totalROI}}/g, Math.round(leadData.roiMetrics.totalROI || 0));
        template = template.replace(/{{hiddenSavings}}/g, Math.round(leadData.roiMetrics.hiddenSavings || 0));
        template = template.replace(/{{hiddenSavings2}}/g, Math.round(leadData.roiMetrics.hiddenSavings * 2 || 0));
        template = template.replace(/{{sixMonthCost}}/g, Math.round(leadData.roiMetrics.totalROI / 2 || 0));
      }

      // Industry-specific variables
      if (leadData.industry === 'Legal Services') {
        template = template.replace(/{{hiddenOpportunityName}}/g, 'Revenue multiplication through freed-up expert time');
        template = template.replace(/{{exampleCompanyType}}/g, 'Mid-sized law firm');
        template = template.replace(/{{exampleVolume}}/g, '10,000');
        template = template.replace(/{{exampleUnit}}/g, 'documents');
        template = template.replace(/{{visibleSavings}}/g, '200');
        template = template.replace(/{{keyRole}}/g, 'Senior attorneys');
        template = template.replace(/{{newFocus}}/g, 'high-value client relationships');
        template = template.replace(/{{hiddenRevenueType}}/g, 'additional billable hours');
        template = template.replace(/{{totalSavings}}/g, '500');
        template = template.replace(/{{roiMultiplier}}/g, '2.5');
      } else if (leadData.industry === 'E-commerce') {
        template = template.replace(/{{hiddenOpportunityName}}/g, 'Increased order volume and customer lifetime value');
        template = template.replace(/{{exampleCompanyType}}/g, 'E-commerce retailer');
        template = template.replace(/{{exampleVolume}}/g, '50,000');
        template = template.replace(/{{exampleUnit}}/g, 'orders');
        template = template.replace(/{{visibleSavings}}/g, '150');
        template = template.replace(/{{keyRole}}/g, 'Customer service team');
        template = template.replace(/{{newFocus}}/g, 'customer relationship building');
        template = template.replace(/{{hiddenRevenueType}}/g, 'increased repeat purchases');
        template = template.replace(/{{totalSavings}}/g, '320');
        template = template.replace(/{{roiMultiplier}}/g, '2.1');
      } else {
        // Generic fallback
        template = template.replace(/{{hiddenOpportunityName}}/g, 'Process optimization and revenue multiplication');
        template = template.replace(/{{exampleCompanyType}}/g, 'Mid-sized company');
        template = template.replace(/{{exampleVolume}}/g, '5,000');
        template = template.replace(/{{exampleUnit}}/g, 'transactions');
        template = template.replace(/{{visibleSavings}}/g, '100');
        template = template.replace(/{{keyRole}}/g, 'Team members');
        template = template.replace(/{{newFocus}}/g, 'strategic initiatives');
        template = template.replace(/{{hiddenRevenueType}}/g, 'business growth');
        template = template.replace(/{{totalSavings}}/g, '250');
        template = template.replace(/{{roiMultiplier}}/g, '2.5');
      }

      // Case study variables
      template = template.replace(/{{caseStudyCompanyName}}/g, 'ClientCorp');
      template = template.replace(/{{caseStudyCompanyType}}/g, leadData.industry || 'Service company');
      template = template.replace(/{{caseStudyHeadcount}}/g, '35');
      template = template.replace(/{{caseStudyAnnualRevenue}}/g, '$8M');
      template = template.replace(/{{caseStudyProblem1}}/g, 'manual data entry');
      template = template.replace(/{{caseStudyProblem2}}/g, 'slow processing times');
      template = template.replace(/{{caseStudyProblem3}}/g, 'high error rates');
      template = template.replace(/{{caseStudyMainPain}}/g, 'manual order processing consuming 40% of team time');
      template = template.replace(/{{caseStudyAnnualCost}}/g, '200');
      template = template.replace(/{{caseStudyHiddenCost}}/g, '150');
      template = template.replace(/{{automationTypes}}/g, 'RPA, AI document processing, and workflow automation');
      template = template.replace(/{{automationPercentage}}/g, '75');
      template = template.replace(/{{keyProcess}}/g, 'order processing');
      template = template.replace(/{{implementationTimeframe}}/g, '6 weeks');
      template = template.replace(/{{implementationEffort}}/g, '15 hours');
      template = template.replace(/{{result1Metric}}/g, 'Processing time per order');
      template = template.replace(/{{result1Before}}/g, '15 minutes');
      template = template.replace(/{{result1After}}/g, '2 minutes');
      template = template.replace(/{{result1Improvement}}/g, '87% faster');
      template = template.replace(/{{result2Metric}}/g, 'Error rate');
      template = template.replace(/{{result2Before}}/g, '2%');
      template = template.replace(/{{result2After}}/g, '0.1%');
      template = template.replace(/{{result2Improvement}}/g, '95% reduction');
      template = template.replace(/{{result3Metric}}/g, 'Orders processed daily');
      template = template.replace(/{{result3Before}}/g, '200');
      template = template.replace(/{{result3After}}/g, '1,500');
      template = template.replace(/{{result3Improvement}}/g, '650% increase');
      template = template.replace(/{{directSavings}}/g, '200');
      template = template.replace(/{{hiddenOpportunitySavings}}/g, '150');
      template = template.replace(/{{totalBenefit}}/g, '350');
      template = template.replace(/{{implementationCost}}/g, '80');
      template = template.replace(/{{yearOneROI}}/g, '338');
      template = template.replace(/{{caseStudyROI}}/g, '338');
      template = template.replace(/{{caseStudyTimeframe}}/g, '90 days');
      template = template.replace(/{{daysAgo}}/g, '14');

      return template;
    } catch (error) {
      logger.error('Failed to load email template', { templateFile, error: error.message, component: 'email-scheduler' });
      return null;
    }
  }

  /**
   * Get emails ready to send
   * @returns {Array} Array of emails ready to send
   */
  getEmailsReadyToSend() {
    const now = new Date();
    return this.emailQueue.filter(
      (email) =>
        email.status === 'scheduled' &&
        email.scheduledTime <= now &&
        email.attempts < email.maxAttempts
    );
  }

  /**
   * Mark email as sent
   * @param {Object} queueItem - Queue item to mark as sent
   */
  markAsSent(queueItem) {
    const index = this.emailQueue.indexOf(queueItem);
    if (index > -1) {
      this.emailQueue[index].status = 'sent';
      this.emailQueue[index].sentAt = new Date();
      logger.info('Email marked as sent', { email: queueItem.email, emailName: queueItem.emailName, component: 'email-scheduler' });
    }
  }

  /**
   * Mark email as failed
   * @param {Object} queueItem - Queue item to mark as failed
   */
  markAsFailed(queueItem) {
    const index = this.emailQueue.indexOf(queueItem);
    if (index > -1) {
      this.emailQueue[index].attempts += 1;
      if (this.emailQueue[index].attempts >= this.emailQueue[index].maxAttempts) {
        this.emailQueue[index].status = 'failed';
        logger.error('Email delivery failed', { email: queueItem.email, emailName: queueItem.emailName, attempts: this.emailQueue[index].attempts, component: 'email-scheduler' });
      } else {
        logger.warn('Email delivery attempt failed', { email: queueItem.email, emailName: queueItem.emailName, attempt: this.emailQueue[index].attempts, maxAttempts: this.emailQueue[index].maxAttempts, component: 'email-scheduler' });
      }
    }
  }

  /**
   * Pause sequence for a lead (e.g., if they book a consultation)
   * @param {string} leadEmail - Lead email address
   */
  pauseSequence(leadEmail) {
    this.emailQueue.forEach((email) => {
      if (email.email === leadEmail && email.status === 'scheduled') {
        email.status = 'paused';
        logger.info('Nurture sequence paused', { email: leadEmail, component: 'email-scheduler' });
      }
    });
  }

  /**
   * Get sequence status for a lead
   * @param {string} leadEmail - Lead email address
   * @returns {Object} Sequence status
   */
  getSequenceStatus(leadEmail) {
    const leadEmails = this.emailQueue.filter((email) => email.email === leadEmail);
    
    return {
      leadEmail,
      totalEmails: leadEmails.length,
      sent: leadEmails.filter((e) => e.status === 'sent').length,
      scheduled: leadEmails.filter((e) => e.status === 'scheduled').length,
      paused: leadEmails.filter((e) => e.status === 'paused').length,
      failed: leadEmails.filter((e) => e.status === 'failed').length,
      emails: leadEmails.map((e) => ({
        id: e.emailSequenceId,
        name: e.emailName,
        status: e.status,
        scheduledTime: e.scheduledTime,
        sentAt: e.sentAt,
      })),
    };
  }

  /**
   * Get all emails in queue
   * @returns {Array} All emails in queue
   */
  getQueueStats() {
    return {
      total: this.emailQueue.length,
      scheduled: this.emailQueue.filter((e) => e.status === 'scheduled').length,
      sent: this.emailQueue.filter((e) => e.status === 'sent').length,
      paused: this.emailQueue.filter((e) => e.status === 'paused').length,
      failed: this.emailQueue.filter((e) => e.status === 'failed').length,
    };
  }
}

module.exports = EmailScheduler;
