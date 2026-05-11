// Scenario Comparison PDF Export Function
// Uses html2pdf library to generate downloadable PDF of scenario comparisons

function exportScenarioComparison() {
  if (!window.scenarioData || !businessProfile) {
    alert('Please run scenario comparison first');
    return;
  }

  // Load html2pdf library dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.onload = function() {
    generateScenarioPDF();
  };
  document.head.appendChild(script);
}

function generateScenarioPDF() {
  const scenarios = window.scenarioData;
  const profile = businessProfile;
  const benchmark = getBenchmarkForIndustry(profile.industry);

  // Create PDF content HTML
  const pdfContent = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #BA7517; padding-bottom: 20px;">
        <h1 style="color: #BA7517; margin: 0 0 10px 0; font-size: 28px;">Scenario Comparison Report</h1>
        <p style="color: #666; margin: 0; font-size: 14px;">AI Automation ROI Analysis</p>
        <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <!-- Company Profile -->
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #BA7517; font-size: 16px; margin: 0 0 12px 0;">Company Profile</h2>
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="padding: 5px 0;"><strong>Company:</strong> ${profile.companyName || 'N/A'}</td>
            <td style="padding: 5px 0; padding-left: 20px;"><strong>Industry:</strong> ${profile.industry || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Employees:</strong> ${profile.headcount || 'N/A'}</td>
            <td style="padding: 5px 0; padding-left: 20px;"><strong>Labor Rate:</strong> $${profile.laborRate || 'N/A'}/hr</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Annual Revenue:</strong> $${(profile.revenue || 0).toLocaleString()}</td>
            <td style="padding: 5px 0; padding-left: 20px;"><strong>Labor Hours:</strong> ${profile.laborHours || 'N/A'} ${profile.laborPeriod || 'month'}</td>
          </tr>
        </table>
      </div>

      <!-- Scenario Comparison Table -->
      <div style="margin-bottom: 25px;">
        <h2 style="color: #BA7517; font-size: 16px; margin: 0 0 12px 0;">Scenario Comparison</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #BA7517; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Metric</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Conservative (30%)</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Moderate (60%)</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Aggressive (100%)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Annual Savings</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">$${(scenarios[0].savings / 1000).toFixed(0)}K</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">$${(scenarios[1].savings / 1000).toFixed(0)}K</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">$${(scenarios[2].savings / 1000).toFixed(0)}K</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>ROI %</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${Math.round(scenarios[0].roi)}%</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd; background: #fffacd;"><strong>${Math.round(scenarios[1].roi)}%</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${Math.round(scenarios[2].roi)}%</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payback Period</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${scenarios[0].payback} months</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd; background: #fffacd;"><strong>${scenarios[1].payback} months</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${scenarios[2].payback} months</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Capacity Multiplier</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${(1 + (scenarios[0].level / 100)).toFixed(1)}x</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd; background: #fffacd;"><strong>${(1 + (scenarios[1].level / 100)).toFixed(1)}x</strong></td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${(1 + (scenarios[2].level / 100)).toFixed(1)}x</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Industry Benchmark Comparison -->
      <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #BA7517;">
        <h2 style="color: #BA7517; font-size: 16px; margin: 0 0 12px 0;">Industry Benchmark Comparison (${profile.industry})</h2>
        <table style="width: 100%; font-size: 12px;">
          <tr>
            <td style="padding: 5px 0;"><strong>Industry Average ROI:</strong> ${benchmark.roi}%</td>
            <td style="padding: 5px 0; padding-left: 20px;"><strong>Your Moderate ROI:</strong> ${Math.round(scenarios[1].roi)}%</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Industry Avg Payback:</strong> ${benchmark.paybackMonths} months</td>
            <td style="padding: 5px 0; padding-left: 20px;"><strong>Your Moderate Payback:</strong> ${scenarios[1].payback} months</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Industry Adoption Rate:</strong> ${benchmark.adoptionRate}%</td>
            <td style="padding: 5px 0; padding-left: 20px;"><strong>Industry Description:</strong> ${benchmark.description}</td>
          </tr>
        </table>
      </div>

      <!-- Recommendation -->
      <div style="background: #f0fff0; padding: 15px; border-radius: 8px; border-left: 4px solid #34D399;">
        <h2 style="color: #34D399; font-size: 16px; margin: 0 0 12px 0;">Recommendation</h2>
        <p style="margin: 0; font-size: 13px;">
          Based on your business profile and industry benchmarks, the <strong>Moderate scenario (60% automation)</strong> offers the optimal balance between ROI and implementation risk. This approach aligns with industry best practices and provides:
        </p>
        <ul style="margin: 10px 0 0 20px; font-size: 13px;">
          <li>Strong ROI of ${Math.round(scenarios[1].roi)}% (${scenarios[1].roi > benchmark.roi ? 'above' : 'below'} industry average)</li>
          <li>Manageable payback period of ${scenarios[1].payback} months</li>
          <li>Capacity multiplier of ${(1 + (scenarios[1].level / 100)).toFixed(1)}x for increased productivity</li>
          <li>Lower implementation risk compared to aggressive automation</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #999;">
        <p style="margin: 0;">This report was generated by Micap AI ROI Calculator</p>
        <p style="margin: 5px 0 0 0;">For questions or to discuss implementation, contact our team at info@micap.ai</p>
      </div>
    </div>
  `;

  // Generate PDF
  const element = document.createElement('div');
  element.innerHTML = pdfContent;

  const opt = {
    margin: 10,
    filename: `Scenario-Comparison-${profile.companyName || 'Report'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(opt).from(element).save();

  // Track PDF export with Meta Pixel
  if (typeof MetaPixelEvents !== 'undefined') {
    MetaPixelEvents.trackCustomEvent('scenario_pdf_export', {
      company: profile.companyName,
      industry: profile.industry,
      automation_level: profile.automationLevel
    });
  }
}
