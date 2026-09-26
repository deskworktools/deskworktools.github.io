#!/usr/bin/env bash
# ==============================================================================
# Deskwork Tools - Zero-Dependency Local Validation Script
# Works on Termux (Android), macOS, Linux, and any standard bash shell.
# ==============================================================================
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
ERRORS=0
WARNINGS=0

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}     Deskwork Tools - Pre-Deployment Validator     ${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# 1. Check Key Required Files
echo -e "${YELLOW}[1/5] Verifying required core files...${NC}"
REQUIRED_FILES=(
  "index.html"
  "about.html"
  "contact.html"
  "privacy.html"
  "terms.html"
  "faq.html"
  "404.html"
  "sitemap.xml"
  "robots.txt"
  "blog/index.html"
  "blog/posts.json"
)
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} Found $file"
  else
    echo -e "  ${RED}✗ MISSING CORE FILE: $file${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done

# 2. Validate JSON in blog/posts.json
echo -e "\n${YELLOW}[2/5] Validating blog/posts.json structure...${NC}"
if [ -f "blog/posts.json" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_JSON_CHECK=$(node -e '
      try {
        const posts = JSON.parse(require("fs").readFileSync("blog/posts.json", "utf8"));
        if (!Array.isArray(posts)) throw new Error("Root is not an array");
        console.log("Found " + posts.length + " valid blog post definitions.");
        posts.forEach((p, idx) => {
          if (!p.title || !p.slug) throw new Error("Post #" + idx + " is missing title or slug");
        });
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    ' 2>&1)
    if [ $? -eq 0 ]; then
      echo -e "  ${GREEN}✓${NC} $NODE_JSON_CHECK"
    else
      echo -e "  ${RED}✗ Invalid JSON in blog/posts.json:${NC} $NODE_JSON_CHECK"
      ERRORS=$((ERRORS + 1))
    fi
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json; json.load(open("blog/posts.json"))' 2>/dev/null && \
      echo -e "  ${GREEN}✓${NC} Valid JSON (checked via python3)" || \
      { echo -e "  ${RED}✗ Invalid JSON in blog/posts.json${NC}"; ERRORS=$((ERRORS + 1)); }
  fi
fi

# 3. Check Sitemap Consistency
echo -e "\n${YELLOW}[3/5] Checking sitemap.xml URLs...${NC}"
if [ -f "sitemap.xml" ]; then
  URL_COUNT=$(grep -c "<loc>" sitemap.xml || true)
  echo -e "  ${GREEN}✓${NC} Sitemap contains $URL_COUNT indexed URLs."
fi

# 4. Check Internal Links & Slugs
echo -e "\n${YELLOW}[4/5] Checking internal files referenced in blog/posts.json...${NC}"
if [ -f "blog/posts.json" ] && command -v node >/dev/null 2>&1; then
  node -e '
    const fs = require("fs");
    const posts = JSON.parse(fs.readFileSync("blog/posts.json", "utf8"));
    let err = 0;
    posts.forEach(p => {
      const htmlPath = "blog/" + p.slug;
      if (!fs.existsSync(htmlPath)) {
        console.log("  \x1b[31m✗ Slug file not found: " + htmlPath + "\x1b[0m");
        err++;
      } else {
        console.log("  \x1b[32m✓\x1b[0m Blog post file exists: " + htmlPath);
      }
    });
    if (err > 0) process.exit(1);
  ' || ERRORS=$((ERRORS + 1))
fi

echo -e "\n${BLUE}====================================================${NC}"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}Validation complete: 0 errors. Ready!${NC}"
  exit 0
else
  echo -e "${RED}Validation finished with $ERRORS error(s). Please fix before deployment.${NC}"
  exit 1
fi
