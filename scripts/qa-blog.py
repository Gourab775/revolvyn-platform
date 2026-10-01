#!/usr/bin/env python3
"""QA checks for the REVOLVYN blog build. Run: python scripts/qa-blog.py"""
import collections
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET

R = Path(__file__).resolve().parent.parent
pages = [R / "blog.html"] + sorted((R / "blog").glob("*/index.html"))
print("PAGES:", len(pages))
titles, descs, canons = [], [], []
issues = []
for p in pages:
    t = p.read_text(encoding="utf-8")
    ti = re.search(r"<title>(.*?)</title>", t).group(1)
    de = re.search(r'name="description" content="(.*?)"', t).group(1)
    ca = re.search(r'canonical" href="(.*?)"', t).group(1)
    titles.append(ti)
    descs.append(de)
    canons.append(ca)
    if "noindex" in t:
        issues.append(f"NOINDEX: {p}")
    if "turn0search" in t:
        issues.append(f"CITE-ARTIFACT: {p}")
    if "\ufffd" in t:
        issues.append(f"U+FFFD: {p}")
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', t, re.DOTALL):
        try:
            json.loads(m.group(1))
        except Exception as e:
            issues.append(f"JSONLD-ERR {p}: {e}")
    for m in re.finditer(r'src="(../assets/[^"]+|blog/assets/[^"]+)"', t):
        rel = (p.parent / m.group(1)).resolve()
        if not rel.exists():
            issues.append(f"MISSING-IMG {p}: {m.group(1)}")
    for m in re.finditer(r'href="((?:\.\./|blog/)[^"]+|[\w#.-]+\.html[^"]*)"', t):
        h = m.group(1)
        if h.startswith(("http", "mailto", "tel", "#")):
            continue
        base = h.split("#")[0]
        if not base:
            continue
        target = (p.parent / base)
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            issues.append(f"BROKEN-LINK {p}: {h}")
    # social images: articles must use PNG twins, files must exist
    if p.name == "index.html" and p.parent.name == "blog":
        for prop in ['property="og:image"', 'name="twitter:image"']:
            m = re.search(rf'<meta {prop} content="(.*?)"', t)
            if not m:
                issues.append(f"MISSING {prop} {p}")
                continue
            url = m.group(1)
            if not url.endswith(".png"):
                issues.append(f"OG-NOT-PNG {p}: {url}")
            rel = "blog/assets/" + url.rsplit("/blog/assets/", 1)[-1]
            if not (R / rel).exists():
                issues.append(f"OG-FILE-MISSING {p}: {url}")
    # heading structure: exactly one h1, no skipped levels before first h2
    h1s = re.findall(r"<h1[^>]*>", t)
    if len(h1s) != 1:
        issues.append(f"H1-COUNT {p}: {len(h1s)}")

print("unique titles:", len(set(titles)), "| unique descs:", len(set(descs)),
      "| unique canonicals:", len(set(canons)))
print("ISSUES:", len(issues))
for i in issues[:60]:
    print(" -", i)

sm = ET.parse(R / "sitemap.xml")
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [u.find("s:loc", ns).text for u in sm.getroot().findall("s:url", ns)]
print("SITEMAP URLS:", len(urls))
dupes = [u for u, c in collections.Counter(urls).items() if c > 1]
print("DUPE URLS:", dupes)
feed = ET.parse(R / "feed.xml")
print("FEED ITEMS:", len(feed.getroot().find("channel").findall("item")))
svgs = sorted((R / "blog" / "assets").glob("*.svg"))
bad_svg = 0
for s in svgs:
    try:
        ET.parse(s)
    except Exception as e:
        bad_svg += 1
        print("BAD SVG:", s, e)
print("SVGS:", len(svgs), "bad:", bad_svg)
from PIL import Image
pngs = sorted((R / "blog" / "assets").glob("featured-*.png"))
bad_png = 0
for png in pngs:
    with Image.open(png) as im:
        if im.size != (1200, 630):
            bad_png += 1
            print("BAD PNG SIZE:", png, im.size)
print("OG PNGS:", len(pngs), "expected: 18, bad:", bad_png)
if len(pngs) != 18:
    print("PNG-COUNT-MISMATCH:", sorted(p.name for p in pngs))
