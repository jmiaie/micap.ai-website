const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

/**
 * Generate a branded ROI analysis PDF report
 * @param {Object} data - ROI analysis data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateROIPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with Micap branding
      doc.fillColor('#1a1a1a');
      doc.fontSize(24).font('Helvetica-Bold').text('Micap AI', 40, 40);
      doc.fontSize(10).fillColor('#d4a574').text('Strategic AI & Agentic Automation Experts', 40, 68);
      
      // Horizontal line
      doc.moveTo(40, 85).lineTo(555, 85).stroke('#d4a574');
      
      // Title
      doc.fontSize(20).fillColor('#1a1a1a').font('Helvetica-Bold').text('ROI Analysis Report', 40, 110);
      doc.fontSize(10).fillColor('#666666').text(`Generated: ${new Date().toLocaleDateString()}`, 40, 135);

      // Company Information
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Company Profile', 40, 160);
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`Company: ${data.companyName || 'N/A'}`, 40, 180);
      doc.text(`Industry: ${data.industry || 'N/A'}`, 40, 195);
      doc.text(`Annual Revenue: $${data.revenue ? Number(data.revenue).toLocaleString() : 'N/A'}`, 40, 210);
      doc.text(`Headcount: ${data.headcount || 'N/A'} employees`, 40, 225);
      doc.text(`Labor Rate: $${data.laborRate || 'N/A'}/hour`, 40, 240);
      doc.text(`Automation Level: ${data.automationLevel || 'N/A'}%`, 40, 255);

      // ROI Metrics Section
      const metricsY = 270;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('ROI Metrics', 40, metricsY);
      
      // Metrics boxes
      const boxWidth = 100;
      const boxHeight = 70;
      const boxSpacing = 130;
      const metricsStartY = metricsY + 25;

      // Calculate metrics
      const laborHours = Number(data.laborHours) || 1600;
      const automationPct = Number(data.automationLevel) || 30;
      const hoursSaved = Math.round(laborHours * (automationPct / 100));
      const monthlySavings = hoursSaved * (Number(data.laborRate) || 35);
      const annualSavings = monthlySavings * 12;
      const capacityMultiplier = (1 / (1 - automationPct / 100)).toFixed(1);
      const roi = Math.round((annualSavings / (Number(data.headcount) * (Number(data.laborRate) || 35) * 2080)) * 100);

      const metrics = [
        { label: 'Monthly Hours Saved', value: `${hoursSaved.toLocaleString()}` },
        { label: 'Monthly Savings', value: `$${monthlySavings.toLocaleString()}` },
        { label: 'Annual Savings', value: `$${annualSavings.toLocaleString()}` },
        { label: 'Capacity Multiplier', value: `${capacityMultiplier}x` }
      ];

      metrics.forEach((metric, index) => {
        const x = 40 + (index % 2) * boxSpacing;
        const y = metricsStartY + (Math.floor(index / 2) * 90);

        // Box background
        doc.rect(x, y, boxWidth, boxHeight).fillAndStroke('#f5f5f5', '#d4a574');
        
        // Metric value
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#d4a574').text(metric.value, x + 5, y + 15, { width: boxWidth - 10 });
        
        // Metric label
        doc.fontSize(9).font('Helvetica').fillColor('#666666').text(metric.label, x + 5, y + 40, { width: boxWidth - 10 });
      });

      // 5-Year Projection
      const projectionY = metricsStartY + 100;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('5-Year Projection', 40, projectionY);

      // Table header
      const tableY = projectionY + 25;
      const colWidth = 110;
      const rowHeight = 25;
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.rect(40, tableY, colWidth, rowHeight).fill('#1a1a1a');
      doc.text('Year', 45, tableY + 7);
      doc.rect(40 + colWidth, tableY, colWidth, rowHeight).fill('#1a1a1a');
      doc.text('Annual Benefit', 45 + colWidth, tableY + 7);
      doc.rect(40 + colWidth * 2, tableY, colWidth, rowHeight).fill('#1a1a1a');
      doc.text('Cumulative', 45 + colWidth * 2, tableY + 7);
      doc.rect(40 + colWidth * 3, tableY, colWidth, rowHeight).fill('#1a1a1a');
      doc.text('ROI %', 45 + colWidth * 3, tableY + 7);

      // Table rows
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      if (data.projection && Array.isArray(data.projection)) {
        data.projection.forEach((row, idx) => {
          const rowY = tableY + rowHeight + (idx * rowHeight);
          const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
          
          doc.rect(40, rowY, colWidth * 4, rowHeight).fill(bgColor);
          doc.text(`Year ${row.year || idx + 1}`, 45, rowY + 7);
          doc.text(`$${Math.round(row.annualBenefit || 0).toLocaleString()}`, 45 + colWidth, rowY + 7);
          doc.text(`$${Math.round(row.cumulativeBenefit || 0).toLocaleString()}`, 45 + colWidth * 2, rowY + 7);
          doc.text(`${row.roi || 0}%`, 45 + colWidth * 3, rowY + 7);
        });
      }

      // Key Recommendations
      const recommendationsY = tableY + (Math.min(5, data.projection?.length || 0) * rowHeight) + 30;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Key Recommendations', 40, recommendationsY);
      
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      const recommendations = [
        '• Prioritize automation in high-labor-cost processes',
        '• Implement AI solutions incrementally to minimize disruption',
        '• Track metrics monthly to validate ROI projections',
        '• Consider phased rollout to manage implementation costs'
      ];
      
      let recY = recommendationsY + 20;
      recommendations.forEach(rec => {
        doc.text(rec, 40, recY);
        recY += 15;
      });

      // Footer
      doc.fontSize(8).fillColor('#999999');
      doc.text('This report is confidential and prepared specifically for the recipient.', 40, doc.page.height - 50);
      doc.text('© 2026 Micap AI Consulting. All rights reserved.', 40, doc.page.height - 30);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateROIPDF };
