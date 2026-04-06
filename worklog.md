---
Task ID: 1
Agent: Main
Task: Fix broken legal page links (Politique de confidentialité, Conditions générales, Mentions légales)

Work Log:
- Identified that the current project (/home/z/my-project) was missing the legal page routes, footer component, and version constants
- Created `src/lib/version.ts` with APP_VERSION, COPYRIGHT_YEAR constants
- Created `src/components/layout/footer.tsx` with LandingFooter, AuthFooter, and AppFooter components
- Created `src/app/politique-de-confidentialite/page.tsx` - Privacy Policy page
- Created `src/app/conditions-generales/page.tsx` - Terms of Service page
- Created `src/app/mentions-legales/page.tsx` - Legal Notice page
- Verified all 3 pages return HTTP 200
- Ran lint with no errors

Stage Summary:
- All three legal pages are now accessible at their correct routes
- Each page includes a consistent header, full legal content, and the LandingFooter with working cross-links
- The footer links to all three legal pages are functional
