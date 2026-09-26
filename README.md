# Deskwork Tools - Website Management & Termux Guide
Welcome to the **Deskwork Tools** repository (`deskworktools.github.io`). This repository powers the free, privacy-first web utilities and guides hosted at **https://deskworktools.github.io/**.

## Repository File Structure
```text
index.html              # Main application (all tools, client-side execution)
about.html              # About page (editorial design system)
contact.html            # Contact page with direct email
privacy.html            # Privacy policy (100% local processing, cookie disclosures)
terms.html              # Terms of Use (legal guidelines and disclaimers)
faq.html                # Comprehensive FAQ & User Guides
404.html                # Custom error page
sitemap.xml             # XML sitemap
robots.txt              # Search engine crawler instructions
favicon.svg             # Coral stamp diamond brand favicon
ads.txt                 # Google AdSense publisher verification
validate.sh             # Zero-dependency validator script
upload-on-termux.sh     # One-step unzip, validate, commit & push script for Termux
blog/
  index.html            # Blog listing with search & category filters
  posts.json            # Blog metadata source
  free-resume-templates-create-a-professional-resume-online.html
  how-to-choose-the-right-resume-format.html
  how-to-write-a-rirekisho-for-a-japan-visa-application.html
```

## Core Platform Principles
1. **100% Client-Side Execution:** No user resumes, documents, or photos are ever sent to remote servers. All processing uses HTML5 Canvas, WebAssembly, and local browser APIs.
2. **IndexedDB Media Storage:** Photos and signatures are saved in the user's browser IndexedDB to prevent memory loss on refresh without hitting `localStorage` 5MB quota errors.
3. **AdSense Ready:** Structured content, dedicated policy pages, transparent contact links, and consistent branding.
