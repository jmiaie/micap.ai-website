/**
 * Meta Pixel Event Tracking Module
 * Tracks key user actions for custom audience creation and retargeting
 */

// Ensure fbq is available
if (typeof fbq === 'undefined') {
  console.warn('Meta Pixel not initialized. Make sure Meta Pixel code is loaded.');
}

// Track page visits
function trackPageView(pageName) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'PageView', {
      page_name: pageName
    });
    console.log(`📊 Meta Pixel: PageView tracked - ${pageName}`);
  }
}

// Track ROI Calculator visit
function trackROICalculatorView() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: 'ROI Calculator',
      content_category: 'calculator',
      content_type: 'page'
    });
    console.log('📊 Meta Pixel: ROI Calculator viewed');
  }
}

// Track ROI Calculator form submission
function trackROICalculatorSubmit(roiData) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', {
      content_name: 'ROI Calculator Submission',
      content_category: 'calculator',
      value: roiData?.potentialSavings || 0,
      currency: 'USD'
    });
    console.log('📊 Meta Pixel: ROI Calculator submitted');
  }
}

// Track lead form submission
function trackLeadFormSubmit(email, phone) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', {
      content_name: 'Lead Form Submission',
      content_category: 'lead_capture',
      email: email,
      phone: phone
    });
    console.log('📊 Meta Pixel: Lead form submitted');
  }
}

// Track email verification
function trackEmailVerification() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'CompleteRegistration', {
      content_name: 'Email Verified',
      content_category: 'verification'
    });
    console.log('📊 Meta Pixel: Email verified');
  }
}

// Track phone verification
function trackPhoneVerification() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'CompleteRegistration', {
      content_name: 'Phone Verified',
      content_category: 'verification'
    });
    console.log('📊 Meta Pixel: Phone verified');
  }
}

// Track PDF report download
function trackReportDownload(leadId) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Purchase', {
      content_name: 'ROI Report Downloaded',
      content_category: 'report',
      content_type: 'pdf',
      value: 0,
      currency: 'USD'
    });
    console.log('📊 Meta Pixel: ROI report downloaded');
  }
}

// Track eBook download
function trackEbookDownload(ebookTitle) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Purchase', {
      content_name: `eBook Downloaded: ${ebookTitle}`,
      content_category: 'ebook',
      content_type: 'pdf',
      value: 50,
      currency: 'USD'
    });
    console.log(`📊 Meta Pixel: eBook downloaded - ${ebookTitle}`);
  }
}

// Track consultation booking click
function trackConsultationBooking() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Contact', {
      content_name: 'Consultation Booking',
      content_category: 'booking'
    });
    console.log('📊 Meta Pixel: Consultation booking clicked');
  }
}

// Track blog article view
function trackBlogArticleView(articleTitle) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: articleTitle,
      content_category: 'blog',
      content_type: 'article'
    });
    console.log(`📊 Meta Pixel: Blog article viewed - ${articleTitle}`);
  }
}

// Track case study view
function trackCaseStudyView(caseStudyTitle) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: caseStudyTitle,
      content_category: 'case_study',
      content_type: 'case_study'
    });
    console.log(`📊 Meta Pixel: Case study viewed - ${caseStudyTitle}`);
  }
}

// Track pricing page view
function trackPricingPageView() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: 'Pricing Page',
      content_category: 'pricing',
      content_type: 'page'
    });
    console.log('📊 Meta Pixel: Pricing page viewed');
  }
}

// Track digital employees page view
function trackDigitalEmployeesView() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: 'Digital Employees',
      content_category: 'services',
      content_type: 'page'
    });
    console.log('📊 Meta Pixel: Digital Employees page viewed');
  }
}

// Track about page view
function trackAboutPageView() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_name: 'About Page',
      content_category: 'company',
      content_type: 'page'
    });
    console.log('📊 Meta Pixel: About page viewed');
  }
}

// Track search/filter action
function trackSearch(searchQuery) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Search', {
      search_string: searchQuery
    });
    console.log(`📊 Meta Pixel: Search - ${searchQuery}`);
  }
}

// Track add to cart (for future e-commerce)
function trackAddToCart(productName, price) {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'AddToCart', {
      content_name: productName,
      content_type: 'product',
      value: price,
      currency: 'USD'
    });
    console.log(`📊 Meta Pixel: Added to cart - ${productName}`);
  }
}

// Track custom event
function trackCustomEvent(eventName, data) {
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, data);
    console.log(`📊 Meta Pixel: Custom event - ${eventName}`);
  }
}

// Export for use in HTML pages
window.MetaPixelEvents = {
  trackPageView,
  trackROICalculatorView,
  trackROICalculatorSubmit,
  trackLeadFormSubmit,
  trackEmailVerification,
  trackPhoneVerification,
  trackReportDownload,
  trackEbookDownload,
  trackConsultationBooking,
  trackBlogArticleView,
  trackCaseStudyView,
  trackPricingPageView,
  trackDigitalEmployeesView,
  trackAboutPageView,
  trackSearch,
  trackAddToCart,
  trackCustomEvent
};

console.log('✅ Meta Pixel Events module loaded');
