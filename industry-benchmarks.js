// Industry Benchmark Data
// Based on 2024-2025 market research and automation adoption rates
// ROI % = average ROI from AI automation initiatives
// Payback Period = average months to recoup investment
// Automation Rate = average % of processes automated

const industryBenchmarks = {
  'Technology': {
    name: 'Technology',
    roi: 285,
    paybackMonths: 8,
    automationRate: 65,
    adoptionRate: 78,
    description: 'Early AI adopters with high automation potential'
  },
  'Healthcare': {
    name: 'Healthcare',
    roi: 210,
    paybackMonths: 12,
    automationRate: 45,
    adoptionRate: 52,
    description: 'Growing AI adoption for administrative tasks'
  },
  'Finance': {
    name: 'Finance / Banking',
    roi: 320,
    paybackMonths: 7,
    automationRate: 70,
    adoptionRate: 82,
    description: 'Highest ROI sector with strong automation focus'
  },
  'Retail': {
    name: 'Retail / E-Commerce',
    roi: 195,
    paybackMonths: 14,
    automationRate: 40,
    adoptionRate: 48,
    description: 'Moderate adoption with customer service focus'
  },
  'Manufacturing': {
    name: 'Manufacturing',
    roi: 240,
    paybackMonths: 10,
    automationRate: 55,
    adoptionRate: 61,
    description: 'Increasing automation in operations and logistics'
  },
  'Real Estate': {
    name: 'Real Estate',
    roi: 165,
    paybackMonths: 16,
    automationRate: 35,
    adoptionRate: 38,
    description: 'Emerging AI adoption for property management'
  },
  'Legal': {
    name: 'Legal Services',
    roi: 250,
    paybackMonths: 9,
    automationRate: 50,
    adoptionRate: 55,
    description: 'Strong ROI from document automation and research'
  },
  'Construction': {
    name: 'Construction',
    roi: 180,
    paybackMonths: 15,
    automationRate: 30,
    adoptionRate: 35,
    description: 'Growing adoption in project management'
  },
  'Hospitality': {
    name: 'Hospitality / Food Service',
    roi: 155,
    paybackMonths: 18,
    automationRate: 25,
    adoptionRate: 30,
    description: 'Early-stage AI adoption for operations'
  },
  'Professional Services': {
    name: 'Professional Services',
    roi: 275,
    paybackMonths: 8,
    automationRate: 60,
    adoptionRate: 70,
    description: 'High ROI from knowledge work automation'
  },
  'Education': {
    name: 'Education',
    roi: 140,
    paybackMonths: 20,
    automationRate: 20,
    adoptionRate: 25,
    description: 'Emerging AI adoption in administrative functions'
  },
  'Logistics': {
    name: 'Logistics / Transportation',
    roi: 260,
    paybackMonths: 9,
    automationRate: 58,
    adoptionRate: 68,
    description: 'Strong ROI from route optimization and tracking'
  },
  'Marketing': {
    name: 'Marketing / Advertising',
    roi: 230,
    paybackMonths: 11,
    automationRate: 52,
    adoptionRate: 62,
    description: 'High adoption for campaign automation'
  },
  'Insurance': {
    name: 'Insurance',
    roi: 290,
    paybackMonths: 8,
    automationRate: 62,
    adoptionRate: 75,
    description: 'Strong ROI from claims processing automation'
  },
  'Other': {
    name: 'Other',
    roi: 200,
    paybackMonths: 12,
    automationRate: 45,
    adoptionRate: 50,
    description: 'Average across all industries'
  }
};

function getBenchmarkForIndustry(industry) {
  return industryBenchmarks[industry] || industryBenchmarks['Other'];
}

function calculateBenchmarkComparison(userROI, userPayback, industry) {
  const benchmark = getBenchmarkForIndustry(industry);
  return {
    benchmark,
    userROI,
    userPayback,
    roiDifference: userROI - benchmark.roi,
    roiPercentage: ((userROI - benchmark.roi) / benchmark.roi * 100).toFixed(1),
    paybackDifference: benchmark.paybackMonths - userPayback,
    paybackPercentage: ((benchmark.paybackMonths - userPayback) / benchmark.paybackMonths * 100).toFixed(1),
    isAboveBenchmark: userROI > benchmark.roi,
    isFasterPayback: userPayback < benchmark.paybackMonths
  };
}
