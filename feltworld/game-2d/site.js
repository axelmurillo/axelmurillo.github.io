import { SITE } from './site-config.js';
export function updateSiteNotices() {
  for (const element of document.querySelectorAll('[data-brand]')) element.textContent = SITE.brand;
  for (const element of document.querySelectorAll('[data-sentiment]')) element.textContent = SITE.sentiment;
  for (const element of document.querySelectorAll('[data-year]')) element.textContent = new Date().getFullYear();
  for (const element of document.querySelectorAll('[data-owner]')) element.textContent = SITE.copyright;
  for (const element of document.querySelectorAll('[data-contact]')) { element.textContent = SITE.email; element.href = `mailto:${SITE.email}`; }
  for (const element of document.querySelectorAll('[data-policy-date]')) element.textContent = SITE.policyDate;
}
updateSiteNotices();
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateSiteNotices(); });
