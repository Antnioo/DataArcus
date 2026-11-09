/*
===================================================================
* DataArcus site bootstrap (every page loads it after site-navigation.js, site-forms.js and site-analytics.js)
*
* At script time, in this order (as the one file did before 0.3.2 SP35):
* - SiteAnalytics.init()      analytics events (GA4 + Clarity), consent enforced there only
* - SiteNavigation.whatsapp() the floating WhatsApp button
* - SiteAnalytics.banner()    the cookie banner
* On DOMContentLoaded:
* - SiteNavigation.init()     particles, AOS, year, navbar, top offsets, anchors, counters, phone menu, ripple,
*                             Escape, blog search and filters, the live report facades
* - SiteForms.init()          the contact and beta forms (Web3Forms), the validation UX
* Each module states its interface at its top; mcp/docs/MODULES.md maps them.
* ===================================================================
*/

window.SiteAnalytics.init();
window.SiteNavigation.whatsapp();
window.SiteAnalytics.banner();

document.addEventListener('DOMContentLoaded', () => {
  window.SiteNavigation.init();
  window.SiteForms.init();
});
