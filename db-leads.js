/**
 * Leads Database Helpers
 * Query functions for lead storage and management
 */

const { query, queryOne } = require('./db');
const logger = require('./logger');

/**
 * Create a new lead
 */
async function createLead(sessionToken, email, phone, companyName, industry, companySize, roiData, consent, score) {
  try {
    const result = await query(
      `INSERT INTO leads 
       (session_token, email, phone, company_name, industry, company_size, roi_data, consent, status, score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionToken, email, phone, companyName, industry, companySize, JSON.stringify(roiData), consent, 'new', score]
    );
    logger.info('Lead created', { leadId: result.insertId, email, score, component: 'db-leads' });
    return result;
  } catch (error) {
    logger.error('Failed to create lead', { error: error.message, email, component: 'db-leads' });
    throw error;
  }
}

/**
 * Get lead by ID
 */
async function getLeadById(id) {
  try {
    const result = await queryOne(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );
    if (result && result.roi_data) {
      result.roi_data = JSON.parse(result.roi_data);
    }
    return result;
  } catch (error) {
    logger.error('Failed to get lead', { error: error.message, leadId: id, component: 'db-leads' });
    throw error;
  }
}

/**
 * Get all leads with optional filtering and sorting
 */
async function getAllLeads(filter = null, sort = 'recent') {
  try {
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    // Apply filters
    if (filter === 'high-value') {
      sql += ' AND score >= 75';
    } else if (filter === 'medium-value') {
      sql += ' AND score >= 50 AND score < 75';
    } else if (filter === 'low-value') {
      sql += ' AND score < 50';
    }

    // Apply sorting
    if (sort === 'score-desc') {
      sql += ' ORDER BY score DESC';
    } else if (sort === 'score-asc') {
      sql += ' ORDER BY score ASC';
    } else if (sort === 'recent') {
      sql += ' ORDER BY created_at DESC';
    }

    const results = await query(sql, params);
    
    // Parse JSON fields
    results.forEach(lead => {
      if (lead.roi_data) {
        lead.roi_data = JSON.parse(lead.roi_data);
      }
    });

    logger.info('Leads retrieved', { count: results.length, filter, sort, component: 'db-leads' });
    return results;
  } catch (error) {
    logger.error('Failed to get leads', { error: error.message, component: 'db-leads' });
    throw error;
  }
}

/**
 * Get leads by email
 */
async function getLeadsByEmail(email) {
  try {
    const results = await query(
      'SELECT * FROM leads WHERE email = ? ORDER BY created_at DESC',
      [email]
    );
    
    results.forEach(lead => {
      if (lead.roi_data) {
        lead.roi_data = JSON.parse(lead.roi_data);
      }
    });

    return results;
  } catch (error) {
    logger.error('Failed to get leads by email', { error: error.message, email, component: 'db-leads' });
    throw error;
  }
}

/**
 * Get leads by status
 */
async function getLeadsByStatus(status) {
  try {
    const results = await query(
      'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    
    results.forEach(lead => {
      if (lead.roi_data) {
        lead.roi_data = JSON.parse(lead.roi_data);
      }
    });

    return results;
  } catch (error) {
    logger.error('Failed to get leads by status', { error: error.message, status, component: 'db-leads' });
    throw error;
  }
}

/**
 * Update lead status
 */
async function updateLeadStatus(id, status) {
  try {
    const result = await query(
      'UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    logger.info('Lead status updated', { leadId: id, status, component: 'db-leads' });
    return result;
  } catch (error) {
    logger.error('Failed to update lead status', { error: error.message, leadId: id, component: 'db-leads' });
    throw error;
  }
}

/**
 * Update lead notes
 */
async function updateLeadNotes(id, notes) {
  try {
    const result = await query(
      'UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [notes, id]
    );
    logger.info('Lead notes updated', { leadId: id, component: 'db-leads' });
    return result;
  } catch (error) {
    logger.error('Failed to update lead notes', { error: error.message, leadId: id, component: 'db-leads' });
    throw error;
  }
}

/**
 * Update lead score
 */
async function updateLeadScore(id, score) {
  try {
    const result = await query(
      'UPDATE leads SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [score, id]
    );
    logger.info('Lead score updated', { leadId: id, score, component: 'db-leads' });
    return result;
  } catch (error) {
    logger.error('Failed to update lead score', { error: error.message, leadId: id, component: 'db-leads' });
    throw error;
  }
}

/**
 * Delete lead
 */
async function deleteLead(id) {
  try {
    const lead = await getLeadById(id);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const result = await query(
      'DELETE FROM leads WHERE id = ?',
      [id]
    );
    logger.info('Lead deleted', { leadId: id, component: 'db-leads' });
    return lead;
  } catch (error) {
    logger.error('Failed to delete lead', { error: error.message, leadId: id, component: 'db-leads' });
    throw error;
  }
}

/**
 * Get lead statistics
 */
async function getLeadStats() {
  try {
    const results = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN score >= 75 THEN 1 END) as high_value,
        COUNT(CASE WHEN score >= 50 AND score < 75 THEN 1 END) as medium_value,
        COUNT(CASE WHEN score < 50 THEN 1 END) as low_value,
        AVG(score) as avg_score,
        COUNT(DISTINCT status) as statuses
      FROM leads
    `);

    const stats = results[0] || {};
    stats.avg_score = Math.round(stats.avg_score || 0);

    logger.info('Lead stats retrieved', { total: stats.total, component: 'db-leads' });
    return stats;
  } catch (error) {
    logger.error('Failed to get lead stats', { error: error.message, component: 'db-leads' });
    throw error;
  }
}

/**
 * Get leads by date range
 */
async function getLeadsByDateRange(startDate, endDate) {
  try {
    const results = await query(
      'SELECT * FROM leads WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate, endDate]
    );
    
    results.forEach(lead => {
      if (lead.roi_data) {
        lead.roi_data = JSON.parse(lead.roi_data);
      }
    });

    return results;
  } catch (error) {
    logger.error('Failed to get leads by date range', { error: error.message, component: 'db-leads' });
    throw error;
  }
}

/**
 * Search leads
 */
async function searchLeads(searchTerm) {
  try {
    const results = await query(
      `SELECT * FROM leads 
       WHERE email LIKE ? OR company_name LIKE ? OR phone LIKE ?
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    
    results.forEach(lead => {
      if (lead.roi_data) {
        lead.roi_data = JSON.parse(lead.roi_data);
      }
    });

    logger.info('Leads search completed', { count: results.length, term: searchTerm, component: 'db-leads' });
    return results;
  } catch (error) {
    logger.error('Failed to search leads', { error: error.message, component: 'db-leads' });
    throw error;
  }
}

module.exports = {
  createLead,
  getLeadById,
  getAllLeads,
  getLeadsByEmail,
  getLeadsByStatus,
  updateLeadStatus,
  updateLeadNotes,
  updateLeadScore,
  deleteLead,
  getLeadStats,
  getLeadsByDateRange,
  searchLeads
};
