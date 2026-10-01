#!/usr/bin/env python3
"""Render 1200x630 PNG social twins of the 18 featured blog SVGs.

Uses the local Playwright Chromium (same engine visitors use) so the PNG
matches the on-page SVG design 1:1. No new artwork is invented here.
Run:  python scripts/make-og-png.py
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
SLUGS = [
 "what-is-performance-marketing", "meta-ads-creative-testing",
 "how-retargeting-works", "ppc-vs-meta-ads",
 "influencer-marketing-guide-for-brands",
 "creator-marketing-vs-influencer-marketing", "youtube-marketing-for-brands",
 "ugc-ads-guide", "video-production-for-d2c-brands",
 "social-media-management-for-growing-brands", "seo-for-d2c-brands",
 "technical-seo-checklist-for-business-websites",
 "content-marketing-vs-content-production",
 "landing-pages-for-paid-campaigns", "ai-ugc-and-ai-product-creatives",
 "full-funnel-digital-marketing-for-growing-brands",
 "digital-marketing-in-kolkata",
 "how-to-choose-digital-marketing-agency-india",
]

def main():
    from PIL import Image
    assets = REPO / "blog" / "assets"
    done, failed = 0, []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630},
                                device_scale_factor=1)
        for slug in SLUGS:
            src = assets / f"featured-{slug}.svg"
            dst = assets / f"featured-{slug}.png"
            assert src.exists(), f"missing SVG: {src}"
            page.goto(src.as_uri())
            page.wait_for_timeout(400)
            el = page.locator("svg")
            el.screenshot(path=str(dst))
            with Image.open(dst) as im:
                if im.size != (1200, 630):
                    failed.append(f"{dst.name}: size {im.size}")
                    continue
            done += 1
        browser.close()
    print(f"PNG OK: {done}/{len(SLUGS)}")
    if failed:
        print("FAILED:")
        for f in failed:
            print(" -", f)
        sys.exit(1)

if __name__ == "__main__":
    main()
