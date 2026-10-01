#!/usr/bin/env python3
"""REVOLVYN blog builder — generates the static blog system from the 18 reviewed drafts.

Source drafts: <repo>/../Revolvyn_Blog_Posts_18 (Downloads folder, editorial review only)
Outputs (all inside the repo, static — no framework):
  blog.html                  real, indexable blog listing (replaces "Coming Soon")
  blog/<slug>/index.html     18 article pages (clean URLs /blog/<slug>/)
  blog/assets/*.svg          original REVOLVYN editorial visuals (black/lime identity)
  blog/IMAGE_SOURCES.md      image provenance record
  sitemap.xml / feed.xml     updated with the 18 article URLs + blog index

Run:  python scripts/build-blog.py
"""
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC_DIR = Path(r"C:\Users\MSI 1\Downloads\Revolvyn_Blog_Posts_18\Revolvyn_Blog_Posts_18")
SITE = "https://revolvynmedia.com"
ORG_ID = f"{SITE}/#business"

CITE_RE = re.compile("\ue200cite(?:\ue202turn0search\\d+)+\ue201")

# ----------------------------------------------------------------------------
# Article catalogue: slug, source file, taxonomy, SEO, visuals, linking.
# Body copy itself is NEVER rewritten here — it is converted 1:1 from source.
# ----------------------------------------------------------------------------
ARTICLES = [
 dict(file="01-what-is-performance-marketing.md", slug="what-is-performance-marketing",
  cat="Performance & Paid Media", date="2026-09-08", read=4,
  title="What Is Performance Marketing? A Guide for Brands | REVOLVYN",
  desc="Performance marketing is a feedback loop across creative, audience, landing and measurement. A practical guide for growing D2C, tech and lifestyle brands.",
  deck="Performance marketing is not running ads and checking numbers \u2014 it is a feedback loop where creative, audience, landing experience and measurement sharpen each other.",
  related=["meta-ads-creative-testing", "how-retargeting-works", "landing-pages-for-paid-campaigns"],
  links=[("performance workflow", "../../services.html#performance-marketing"),
         ("research page", "../../research.html"),
         ("combines performance marketing with content production", "../../services.html#content-production")],
  svc=("This loop is the operating core of REVOLVYN\u2019s "
       "<a href=\"../../services.html#performance-marketing\">performance marketing</a> service \u2014 "
       "Meta ads, Google Ads and PPC, retargeting, creative testing and landing-page recommendations, "
       "reviewed weekly. The <a href=\"../../research.html\">research page</a> explains how that testing works."),
  cta=0,
  feat=("cycle", "Performance marketing", "The learning loop", ["Creative", "Audience", "Click", "Landing", "Conversion", "Next test"],
        "Diagram of the performance marketing feedback loop from creative to audience to click to landing to conversion to next test"),
  figs=[(0, "split", "Full-funnel thinking", "Same budget, two jobs", ["Prospecting: introduce the problem and product", "Remarketing: answer objections, close"],
        "Diagram contrasting prospecting creative for new audiences with remarketing creative for warm visitors",
        "Prospecting and remarketing should not receive identical creative."),
        (3, "checklist", "Beyond the dashboard", "Numbers \u2192 decisions", ["Which hooks deserve another version?", "Where does the landing page lose intent?", "Which idea should be stopped?"],
        "Checklist showing how dashboard numbers translate into creative and landing decisions", "A dashboard tells you what happened \u2014 decisions make the next campaign smarter.")]),

 dict(file="02-meta-ads-creative-testing.md", slug="meta-ads-creative-testing",
  cat="Performance & Paid Media", date="2026-09-10", read=4,
  title="Meta Ads Creative Testing: What to Test First | REVOLVYN",
  desc="When a Meta campaign underperforms, check the creative first. What to test \u2014 hooks, ideas, formats \u2014 and a practical testing rhythm for D2C brands.",
  deck="Before you raise the budget, check the creative: test the hook and the idea first, change one thing at a time, and read the full funnel.",
  related=["what-is-performance-marketing", "ugc-ads-guide", "landing-pages-for-paid-campaigns"],
  links=[("own research", "../../research.html"),
         ("performance service", "../../services.html#performance-marketing")],
  svc=("Hook-first testing is documented on REVOLVYN\u2019s <a href=\"../../research.html\">research page</a>, and it runs "
       "inside live campaigns in the <a href=\"../../services.html#performance-marketing\">performance marketing</a> service "
       "\u2014 hooks first, then formats, then audiences."),
  cta=1,
  feat=("grid", "Meta ads", "Six openings worth testing", ["Problem-first", "Product demo", "Outcome-led", "Creator take", "Scenario", "Transformation"],
        "Grid of six Meta ad hook concepts including problem-first opening, product demonstration and creator explanation"),
  figs=[(0, "flow", "Start with the hook", "One body, many openings", ["Same ad body", "6 different openings", "Clear winner"],
        "Diagram showing one ad body tested with several different opening hooks to find a clear winner",
        "Keep the body similar while the opening changes \u2014 that gives you a clearer question to answer."),
        (5, "flow", "Testing rhythm", "Hypothesis \u2192 creative \u2192 test \u2192 read \u2192 iterate", ["Hypothesis", "Creative", "Test", "Read", "Iterate"],
        "Five-step creative testing rhythm from hypothesis to creative to test to reading results to iteration",
        "The objective is a library of winning ideas, not one winning ad.")]),

 dict(file="03-how-retargeting-works.md", slug="how-retargeting-works",
  cat="Performance & Paid Media", date="2026-09-12", read=3,
  title="How Retargeting Works: A Practical Guide | REVOLVYN",
  desc="Retargeting turns previous attention into the next conversation. How staged messaging, creative and measurement make warm audiences convert.",
  deck="Most visitors don\u2019t buy on the first visit. Retargeting works when the second message assumes the first conversation already happened.",
  related=["what-is-performance-marketing", "meta-ads-creative-testing", "full-funnel-digital-marketing-for-growing-brands"],
  links=[("performance marketing workflow", "../../services.html#performance-marketing"),
         ("combines performance marketing with content production", "../../services.html#content-production")],
  svc=("Retargeting runs inside REVOLVYN\u2019s <a href=\"../../services.html#performance-marketing\">performance marketing</a> workflow "
       "with full-funnel strategy and weekly reporting \u2014 and the <a href=\"../../services.html#content-production\">content production</a> "
       "team develops the multiple creative angles each stage needs."),
  cta=2,
  feat=("flow", "Retargeting", "The second conversation", ["First visit", "Consideration", "Conversion"],
        "Funnel diagram of the retargeting journey from first website visit through consideration to conversion"),
  figs=[(2, "flow", "Build a sequence", "Message follows memory", ["Introduce the problem", "Demonstrate the product", "Answer the objection"],
        "Diagram of a three-step retargeting message sequence from introduction to demonstration to objection handling",
        "Repeated exposure irritates when the message never changes \u2014 build a sequence instead.")]),

 dict(file="04-ppc-vs-meta-ads.md", slug="ppc-vs-meta-ads",
  cat="Performance & Paid Media", date="2026-09-15", read=3,
  title="PPC vs Meta Ads: Differences & When to Use Each | REVOLVYN",
  desc="PPC captures demand that already exists; Meta ads create demand before the search. How growing brands should think about the mix.",
  deck="Search captures demand that already exists; Meta creates demand before the search. Most growing brands eventually need both.",
  related=["what-is-performance-marketing", "meta-ads-creative-testing", "full-funnel-digital-marketing-for-growing-brands"],
  links=[("performance service", "../../services.html#performance-marketing"),
         ("content production service", "../../services.html#content-production")],
  svc=("REVOLVYN runs both sides \u2014 the <a href=\"../../services.html#performance-marketing\">performance service</a> covers Meta Ads, "
       "Google Ads and PPC with full-funnel testing, backed by a <a href=\"../../services.html#content-production\">content production</a> "
       "engine sized for Meta\u2019s creative appetite."),
  cta=0,
  feat=("split", "Paid media", "Intent vs discovery", ["Search: \u201cI am looking for something\u201d", "Meta: \u201cThis is relevant to me\u201d"],
        "Split visual contrasting search advertising intent with Meta advertising discovery", "Two different arrival moments \u2014 plan the creative for each."),
  figs=[(4, "checklist", "Channel cheat-sheet", "Which job is this?", ["Search captures existing demand", "Meta creates new demand", "Creative burden is higher on Meta", "Judge the mix, not each click"],
        "Checklist comparing search and Meta ads on demand capture, creative needs and measurement", "The right question is which combination creates, captures and converts demand.")]),

 dict(file="05-influencer-marketing-guide-for-brands.md", slug="influencer-marketing-guide-for-brands",
  cat="Creator & Influencer", date="2026-09-17", read=3,
  title="Influencer Marketing for Brands: Campaign Guide | REVOLVYN",
  desc="How to build an influencer campaign that fits: define the job, pick audience fit over follower count, brief well and measure against the goal.",
  deck="Start with the campaign\u2019s job, pick audience fit over follower count, brief clearly \u2014 and treat creator content as future ad creative.",
  related=["creator-marketing-vs-influencer-marketing", "youtube-marketing-for-brands", "ugc-ads-guide"],
  links=[("influencer service", "../../services.html#influencer-marketing"),
         ("110+ YouTubers", "../../community.html"),
         ("Meta ads and content production", "../../services.html#content-production")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#influencer-marketing\">influencer service</a> covers strategy, selection, "
       "concepts and monthly review across a network of <a href=\"../../community.html\">110+ YouTubers</a> \u2014 connected to "
       "paid media and <a href=\"../../services.html#content-production\">content production</a> rather than run in isolation."),
  cta=1,
  feat=("flow", "Influencer marketing", "From job to learning", ["Campaign job", "Audience fit", "Clear brief", "Creator network", "Measure"],
        "Workflow diagram for an influencer campaign from defining the goal to audience fit to briefing to measurement"),
  figs=[(2, "checklist", "The brief", "Structure without killing the content", ["The product truth", "The audience problem", "Required facts", "Claims to avoid", "Desired action"],
        "Checklist of what a good creator brief must contain from product truth to desired action",
        "Give the creator the non-negotiables \u2014 then leave room for natural delivery.")]),

 dict(file="06-creator-marketing-vs-influencer-marketing.md", slug="creator-marketing-vs-influencer-marketing",
  cat="Creator & Influencer", date="2026-09-19", read=3,
  title="Creator Marketing vs Influencer Marketing | REVOLVYN",
  desc="Are creator marketing and influencer marketing actually different? The useful distinction is the job you are hiring the creator to do.",
  deck="Influencer marketing buys trusted access to an audience; creator marketing buys the ability to make native content. Plan for the job you\u2019re hiring for.",
  related=["influencer-marketing-guide-for-brands", "youtube-marketing-for-brands", "ugc-ads-guide"],
  links=[("creator campaign service", "../../services.html#influencer-marketing")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#influencer-marketing\">creator campaign service</a> combines strategy, selection, "
       "scripts, coordination, editing and monthly review \u2014 treating creators as distribution partners and content collaborators."),
  cta=2,
  feat=("split", "Creator vs influencer", "Access vs ability", ["Influence-first: reach, relevance, credibility", "Content-first: demonstration, explanation, native feel"],
        "Split visual contrasting influence-first partnerships with content-first creator marketing", "Overlapping \u2014 the distinction is the job."),
  figs=[(3, "checklist", "Selection framework", "Five fits, no single number", ["Audience fit", "Content fit", "Communication fit", "Production fit", "Brand fit"],
        "Checklist of the five creator selection criteria from audience fit to brand fit", "No single number answers all five.")]),

 dict(file="07-youtube-marketing-for-brands.md", slug="youtube-marketing-for-brands",
  cat="Creator & Influencer", date="2026-09-22", read=3,
  title="YouTube Marketing for Brands: Beyond Shoutouts | REVOLVYN",
  desc="YouTube marketing is more than paying for a shoutout: audience fit, integrations with a reason to exist, and content that feeds the funnel.",
  deck="A strong integration gives the product a logical role in the video \u2014 then lets that video feed the wider funnel instead of sitting apart from it.",
  related=["influencer-marketing-guide-for-brands", "creator-marketing-vs-influencer-marketing", "video-production-for-d2c-brands"],
  links=[("network of 110+ YouTubers", "../../community.html"),
         ("broader service model", "../../services.html"),
         ("creator workflow", "../../services.html#influencer-marketing")],
  svc=("REVOLVYN works with a <a href=\"../../community.html\">network of 110+ YouTubers</a> across a "
       "<a href=\"../../services.html#influencer-marketing\">creator workflow</a> of strategy, scripts, "
       "shoots, editing and monthly reviews \u2014 see the <a href=\"../../services.html\">service model</a> for how it connects to paid and content."),
  cta=0,
  feat=("flow", "YouTube marketing", "More than a shoutout", ["Right audience", "Natural integration", "Wider funnel", "Learn"],
        "Diagram showing YouTube creator content feeding a wider marketing funnel from awareness to conversion"),
  figs=[(3, "flow", "One video, one hypothesis", "Test ideas across creators", ["Education angle", "Demonstration angle", "Storytelling angle"],
        "Diagram of three creator videos testing different communication angles for the same product",
        "Different creators, different angles \u2014 discover which message is easiest to understand.")]),

 dict(file="08-ugc-ads-guide.md", slug="ugc-ads-guide",
  cat="Content, Social & AI", date="2026-09-24", read=3,
  title="UGC Ads: Creator-Style Content for Performance | REVOLVYN",
  desc="Why creator-style content can work in performance marketing \u2014 and what it still needs: a real problem, a clear message and tested ideas.",
  deck="Creator-style content earns attention differently \u2014 but only when it opens with a real problem and tests different ideas, not 30 versions of one ad.",
  related=["meta-ads-creative-testing", "video-production-for-d2c-brands", "ai-ugc-and-ai-product-creatives"],
  links=[("research", "../../research.html"),
         ("AI Content & Creative Automation service", "../../services.html#ai-content")],
  svc=("REVOLVYN\u2019s <a href=\"../../research.html\">research</a> notes on UGC vs polished film, and the "
       "<a href=\"../../services.html#ai-content\">AI Content & Creative Automation</a> service for AI UGC, product creatives and voiceovers \u2014 "
       "with human direction on every idea."),
  cta=1,
  feat=("flow", "UGC ads", "Problem first, product second", ["Recognised problem", "Product as solution", "Clear CTA"],
        "Diagram of a UGC ad structure opening with the audience problem before introducing the product"),
  figs=[(3, "grid", "Test the idea, not the filter", "Eight angles to try", ["Problem-first", "Demo-first", "Comparison", "Objection handling", "Use case", "Founder take"],
        "Grid of six UGC creative angles from problem-first to founder explanation", "Change the communication idea, not just the visual treatment.")]),

 dict(file="09-video-production-for-d2c-brands.md", slug="video-production-for-d2c-brands",
  cat="Content, Social & AI", date="2026-09-26", read=3,
  title="Video Production for D2C Brands: What to Produce | REVOLVYN",
  desc="D2C brands need a library, not one hero film. How to plan shoots from the distribution plan and produce for reuse across ads and site.",
  deck="Plan the shoot from the distribution plan: one production day should fill the ad library \u2014 ads, Reels, demos, site video and retargeting cuts.",
  related=["ugc-ads-guide", "content-marketing-vs-content-production", "ai-ugc-and-ai-product-creatives"],
  links=[("content production service", "../../services.html#content-production"),
         ("paid media", "../../services.html#performance-marketing")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#content-production\">content production service</a> covers scripts, shoots, editing, "
       "motion graphics, grading and captions at 35\u201340+ videos a month \u2014 see the <a href=\"../../portfolio.html\">portfolio</a> for the output."),
  cta=2,
  feat=("grid", "Video production", "One shoot, six destinations", ["Paid ads", "Reels", "Demos", "Website", "Launch", "Retargeting"],
        "Grid showing six destinations for video footage from paid ads to product demos to retargeting cuts"),
  figs=[(1, "checklist", "Shoot for reuse", "Capture the library", ["Product details", "Demonstrations", "Problem moments", "Lifestyle scenes", "Alternate openings", "Clean product footage"],
        "Checklist of footage to capture on a shoot so editing has options later", "Produce with reuse in mind \u2014 every shoot becomes more valuable.")]),

 dict(file="10-social-media-management-for-growing-brands.md", slug="social-media-management-for-growing-brands",
  cat="Content, Social & AI", date="2026-09-27", read=3,
  title="Social Media Management for Growing Brands | REVOLVYN",
  desc="Good social media management is more than posting consistently: platform roles, repeatable themes, community and reporting that improves the plan.",
  deck="Consistency is table stakes. Good management means repeatable themes, trend judgment, community, and reporting that changes next month\u2019s plan.",
  related=["ugc-ads-guide", "content-marketing-vs-content-production", "full-funnel-digital-marketing-for-growing-brands"],
  links=[("social media service", "../../services.html#social-media"),
         ("performance marketing and content production", "../../services.html#performance-marketing")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#social-media\">social media service</a> covers strategy, planning, Reels, carousels, "
       "copy, community and monthly reporting \u2014 kept connected to <a href=\"../../services.html#performance-marketing\">performance marketing</a> "
       "so insights flow both ways."),
  cta=0,
  feat=("cycle", "Social media", "The monthly loop", ["Strategy", "Plan", "Produce", "Publish", "Engage", "Analyse"],
        "Circular diagram of the social media workflow from strategy to publishing to community to analysis"),
  figs=[(1, "grid", "Five repeatable themes", "A feed with a point of view", ["Education", "Product", "Proof", "Culture", "Conversation"],
        "Grid of five social content themes from education to product to proof to culture to conversation",
        "Recurring themes give the feed a reason to exist beyond filling a calendar.")]),

 dict(file="11-seo-for-d2c-brands.md", slug="seo-for-d2c-brands",
  cat="SEO & Websites", date="2026-09-28", read=3,
  title="SEO for D2C Brands: Foundations Before Keywords | REVOLVYN",
  desc="Strong SEO starts before keywords: match pages to intent, give every topic a home, build the technical base and use first-hand product knowledge.",
  deck="Match pages to search intent, give every topic a clear home, build the technical base \u2014 then compound with content only you could write.",
  related=["technical-seo-checklist-for-business-websites", "content-marketing-vs-content-production", "digital-marketing-in-kolkata"],
  links=[("SEO service", "../../services.html#website-seo"),
         ("service materials", "../../services.html#website-seo")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#website-seo\">SEO service</a> combines technical SEO, content strategy, competitor "
       "research, local SEO and optimisation with conversion-focused sites and analytics \u2014 a 3\u20136 month compounding process."),
  cta=1,
  feat=("flow", "SEO", "Intent \u2192 page \u2192 topic", ["Search intent", "Right page", "Topic cluster", "Measure"],
        "Diagram mapping search intent to the right page type within a topic cluster structure"),
  figs=[(3, "grid", "Topics, not keyword lists", "One reason per page", ["How-to guides", "Ingredient education", "Use guides", "Comparisons", "Product Q&A"],
        "Grid of topic page types from how-to guides to comparisons that give each article a reason to exist",
        "Each article should have a reason to exist \u2014 build topics, not keyword lists.")]),

 dict(file="12-technical-seo-checklist-for-business-websites.md", slug="technical-seo-checklist-for-business-websites",
  cat="SEO & Websites", date="2026-09-29", read=3,
  title="Technical SEO Checklist for Business Websites | REVOLVYN",
  desc="A practical technical SEO checklist: crawl, indexation, canonicals, sitemap, titles, headings, mobile, internal links and measurement.",
  deck="Crawl, index, canonicals, sitemap, titles, headings, mobile, internal links, measurement \u2014 the technical checks that actually matter.",
  related=["seo-for-d2c-brands", "content-marketing-vs-content-production", "landing-pages-for-paid-campaigns"],
  links=[("service page", "../../services.html#website-seo")],
  svc=("Technical work is part of REVOLVYN\u2019s <a href=\"../../services.html#website-seo\">Website + SEO</a> track \u2014 technical fixes in weeks, "
       "content and authority compounding over months. Talk through your site on the <a href=\"../../contact.html\">contact page</a>."),
  cta=2,
  feat=("flow", "Technical SEO", "Access \u2192 understand \u2192 experience", ["Crawl", "Index", "Render", "Experience"],
        "Pipeline diagram of technical SEO from crawling to indexing to rendering to page experience"),
  figs=[(0, "checklist", "The nine checks", "Work through in order", ["Crawlable pages", "Deliberate indexation", "Clear canonicals", "Accurate sitemap", "Aligned titles", "Readable structure", "Mobile + vitals", "Easy internal reach", "Real measurement"],
        "Checklist of nine technical SEO checks from crawlability to measurement", "Treat it as an ongoing system, not a one-time checklist.")]),

 dict(file="13-content-marketing-vs-content-production.md", slug="content-marketing-vs-content-production",
  cat="Content, Social & AI", date="2026-09-29", read=3,
  title="Content Marketing vs Content Production | REVOLVYN",
  desc="Production creates the asset; marketing decides why it should exist and where it belongs. Why growing brands need both, connected by feedback.",
  deck="Production asks how we make it; marketing asks why it should exist and where it belongs. Growth needs both, connected by performance feedback.",
  related=["video-production-for-d2c-brands", "seo-for-d2c-brands", "ai-ugc-and-ai-product-creatives"],
  links=[("content production service", "../../services.html#content-production")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#content-production\">content production service</a> covers scripting, shoots, editing, "
       "motion graphics and captions at 35\u201340+ videos a month \u2014 planned against strategy in the "
       "<a href=\"../../services.html#growth-consulting\">growth consulting</a> layer, not in isolation."),
  cta=0,
  feat=("split", "Content", "Why vs how", ["Marketing: why this, for whom, where next", "Production: script, shoot, edit, finish"],
        "Split visual contrasting content marketing strategy with content production craft", "Different jobs \u2014 one system."),
  figs=[(2, "grid", "Give every asset a role", "Five content jobs", ["Discovery", "Education", "Product", "Proof", "Conversion"],
        "Grid of five content roles from discovery to education to product to proof to conversion",
        "Strategy decides what deserves to be made. Production makes it well.")]),

 dict(file="14-landing-pages-for-paid-campaigns.md", slug="landing-pages-for-paid-campaigns",
  cat="Performance & Paid Media", date="2026-09-30", read=3,
  title="Landing Pages for Paid Campaigns: A Guide | REVOLVYN",
  desc="The ad earns the click; the landing page earns the next step. Message match, focused structure and testing creative and page together.",
  deck="The ad earns the click; the page earns the next step. Keep the message continuous, answer the visitor\u2019s questions, and test them together.",
  related=["what-is-performance-marketing", "meta-ads-creative-testing", "how-retargeting-works"],
  links=[("performance service", "../../services.html#performance-marketing")],
  svc=("Landing-page recommendations and conversion optimisation sit inside REVOLVYN\u2019s "
       "<a href=\"../../services.html#performance-marketing\">performance service</a> \u2014 alongside paid advertising and creative testing \u2014 "
       "with the site itself covered by <a href=\"../../services.html#website-seo\">Website + SEO</a>."),
  cta=1,
  feat=("flow", "Landing pages", "One journey, two halves", ["Ad promise", "Landing proof", "Next step"],
        "Diagram of the ad to landing page to conversion journey with consistent messaging"),
  figs=[(5, "checklist", "Before sending traffic", "Seven questions", ["Is the offer immediately clear?", "Does the page continue the ad?", "Is the next action obvious?", "Is proof easy to find?", "Are distractions removed?", "Does mobile work?", "Can conversions be measured?"],
        "Checklist of seven questions to review a landing page before sending paid traffic",
        "The best page gives the right visitor enough confidence to take the next step.")]),

 dict(file="15-ai-ugc-and-ai-product-creatives.md", slug="ai-ugc-and-ai-product-creatives",
  cat="Content, Social & AI", date="2026-09-30", read=3,
  title="AI UGC & AI Product Creatives: Where They Fit | REVOLVYN",
  desc="AI buys creative testing volume; human direction decides what ships. Where AI UGC and AI product creatives fit in a modern content system.",
  deck="AI buys testing volume \u2014 more variations, faster. Human direction still decides the idea, the claims and what ships. The best setup is hybrid.",
  related=["ugc-ads-guide", "meta-ads-creative-testing", "video-production-for-d2c-brands"],
  links=[("AI Content & Creative Automation service", "../../services.html#ai-content"),
         ("content production", "../../services.html#content-production")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html#ai-content\">AI Content & Creative Automation</a> service covers AI UGC, product creatives, "
       "brand-specific imagery and voiceovers \u2014 connected to <a href=\"../../services.html#content-production\">content production</a>, "
       "influencer marketing and performance rather than sold as a replacement for strategy."),
  cta=2,
  feat=("split", "AI creative", "Speed + judgement", ["AI: variations, concepts, voiceovers, volume", "Humans: idea, claims, brand fit, what ships"],
        "Split visual showing AI production speed combined with human creative judgement", "More useful learning per unit of effort."),
  figs=[(5, "grid", "The hybrid mix", "Each format earns its place", ["Cinematic campaigns", "Creator content", "AI rapid tests", "Performance reads"],
        "Grid of the hybrid content mix from cinematic production to creator content to AI testing to performance measurement",
        "The goal is not more AI \u2014 it is more useful creative learning per unit of production effort.")]),

 dict(file="16-full-funnel-digital-marketing-for-growing-brands.md", slug="full-funnel-digital-marketing-for-growing-brands",
  cat="Strategy & Growth", date="2026-09-30", read=3,
  title="Full-Funnel Digital Marketing for Growing Brands | REVOLVYN",
  desc="Attention, trust, conversion: one customer journey, not separate departments. How full-funnel marketing connects channels into learning.",
  deck="Attention, trust, conversion: one journey, not three departments. The wins come from moving learnings between channels.",
  related=["what-is-performance-marketing", "how-retargeting-works", "influencer-marketing-guide-for-brands"],
  links=[("model", "../../services.html")],
  svc=("REVOLVYN\u2019s <a href=\"../../services.html\">model</a> is one team across strategy, creative, media and reporting \u2014 performance, "
       "content, SEO, social, influencer and AI content planned as a single funnel. Start with a free 15-minute consultation via "
       "<a href=\"../../contact.html\">contact</a>."),
  cta=0,
  feat=("funnel", "Full funnel", "Attention \u2192 trust \u2192 conversion", ["Attention: become relevant", "Trust: help them believe", "Conversion: make action clear"],
        "Funnel diagram from attention to trust to conversion for full-funnel digital marketing"),
  figs=[(4, "cycle", "Let learnings travel", "Creator \u21d4 paid \u21d4 content \u21d4 search", ["Creator insight", "Paid test", "Content answers", "Search reveals"],
        "Loop diagram showing learnings moving between creator campaigns, paid media, content and search",
        "A creator insight becomes a paid test, becomes performance learning, becomes the next brief.")]),

 dict(file="17-digital-marketing-in-kolkata.md", slug="digital-marketing-in-kolkata",
  cat="Strategy & Growth", date="2026-10-01", read=3,
  title="Digital Marketing in Kolkata: A Practical Guide | REVOLVYN",
  desc="Kolkata is context, not strategy. How Kolkata-based brands can build a practical channel mix \u2014 local search, paid reads, compounding SEO.",
  deck="Kolkata is context, not strategy: match channels to the business, use local search where it matters, and pair fast paid reads with compounding SEO.",
  related=["full-funnel-digital-marketing-for-growing-brands", "seo-for-d2c-brands", "how-to-choose-digital-marketing-agency-india"],
  links=[("works with D2C, tech and lifestyle brands", "../../brands.html"),
         ("service material", "../../services.html#performance-marketing")],
  svc=("REVOLVYN is based in Kolkata and <a href=\"../../brands.html\">works with D2C, tech and lifestyle brands</a> across India and beyond \u2014 "
       "the full <a href=\"../../services.html#performance-marketing\">service range</a> from paid testing to SEO under one roof."),
  cta=1,
  feat=("split", "Kolkata, and beyond", "Local base, national reach", ["Local: accurate listings, relevant pages", "National: paid, creators, content, SEO"],
        "Split visual showing local marketing foundations alongside national paid, creator and content reach", "Location is identity \u2014 not a restriction on the campaign."),
  figs=[(4, "split", "Two timelines", "Fast reads, slow compounding", ["Paid: directional reads in 2\u20134 weeks", "SEO: compounds over 3\u20136 months"],
        "Timeline comparison of paid campaigns giving fast reads versus SEO compounding over months", "A sensible plan uses both rather than expecting one channel to do everything.")]),

 dict(file="18-how-to-choose-digital-marketing-agency-india.md", slug="how-to-choose-digital-marketing-agency-india",
  cat="Strategy & Growth", date="2026-10-01", read=4,
  title="How to Choose a Digital Marketing Agency in India | REVOLVYN",
  desc="Choosing an agency is about fit, not vocabulary. A practical checklist: the problem, the work, the team, testing, reporting and month two.",
  deck="Define the problem, inspect the work, meet the team behind it, understand testing and reporting \u2014 then choose for fit, not vocabulary.",
  related=["full-funnel-digital-marketing-for-growing-brands", "digital-marketing-in-kolkata", "what-is-performance-marketing"],
  links=[("portfolio", "../../portfolio.html"),
         ("brands page", "../../brands.html"),
         ("performance service", "../../services.html#performance-marketing")],
  svc=("REVOLVYN\u2019s <a href=\"../../portfolio.html\">portfolio</a> of ad films and campaign work and the "
       "<a href=\"../../brands.html\">brands page</a> of D2C, tech and lifestyle clients are the evidence to inspect \u2014 with the "
       "<a href=\"../../services.html#performance-marketing\">performance service</a> spelling out testing, landing work and weekly reporting."),
  cta=2,
  feat=("grid", "Choosing an agency", "Eight checks before you sign", ["Problem first", "Inspect the work", "Meet the team", "Testing process", "Honest promises", "Clear reporting", "Month-two plan", "Fit over vocabulary"],
        "Grid of eight criteria for choosing a digital marketing agency from defining the problem to checking fit", "Choose the team whose process you understand."),
  figs=[(3, "checklist", "Ask about testing", "What happens when an ad fails?", ["Change the audience?", "Change the creative?", "Change the offer?", "Change the landing page?"],
        "Checklist of questions about an agency testing process when advertising does not work",
        "A useful agency can explain its learning process without hiding behind jargon."),
        (4, "split", "Promises vs process", "Guarantees are a red flag", ["Avoid: guaranteed rankings or sales", "Ask: what will you test and measure?"],
        "Comparison of guaranteed results claims versus test-and-measure process questions",
        "Ask what happens when the first approach does not work.")]),
]

CTA_COPY = [
 ("Talk to REVOLVYN about your growth plan.",
  "Have a campaign in mind? Start with a free 15-minute consultation and we\u2019ll reply within one business day."),
 ("Need help connecting paid media, creative and conversion?",
  "Talk to the REVOLVYN team. Start with a free 15-minute consultation \u2014 bring a product and a hypothesis, we\u2019ll bring the creative engine."),
 ("Choosing what to do next?",
  "Get a second opinion before you commit budget. Start with a free 15-minute consultation \u2014 no pricing games, no guaranteed miracles."),
]

BY_SLUG = {a["slug"]: a for a in ARTICLES}

# ----------------------------------------------------------------------------
# Markdown conversion (faithful: headings / paragraphs / lists / bold only)
# ----------------------------------------------------------------------------
def inline_md(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    return t

def convert_body(md_text, links):
    md_text = CITE_RE.sub("", md_text)
    lines = md_text.split("\n")
    blocks = []  # (kind, payload)
    i = 0
    # drop title + meta header lines
    body_lines = []
    for ln in lines:
        s = ln.strip()
        if s.startswith("# ") and not body_lines:
            continue
        if re.match(r"^\*\*(Primary intent|Audience|Suggested slug):\*\*", s):
            continue
        body_lines.append(ln)
    # trim leading blanks
    while body_lines and not body_lines[0].strip():
        body_lines.pop(0)
    buf = []
    def flush_para():
        if buf:
            blocks.append(("p", " ".join(b.strip() for b in buf)))
            buf.clear()
    in_list = None  # 'ul' | 'ol'
    list_items = []
    def flush_list():
        nonlocal in_list
        if in_list:
            blocks.append((in_list, list_items.copy()))
            list_items.clear()
            in_list = None
    editorial = []
    in_editorial = False
    for ln in body_lines:
        s = ln.strip()
        if s.startswith("### Editorial note"):
            flush_para(); flush_list(); in_editorial = True
            continue
        if s.startswith("## "):
            flush_para(); flush_list()
            blocks.append(("h2", s[3:].strip()))
            continue
        if s.startswith("### "):
            flush_para(); flush_list()
            blocks.append(("h3", s[4:].strip()))
            continue
        if s == "---":
            flush_para(); flush_list()
            continue
        m_ul = re.match(r"^[-*]\s+(.*)$", s)
        m_ol = re.match(r"^\d+\.\s+(.*)$", s)
        if m_ul or m_ol:
            flush_para()
            kind = "ul" if m_ul else "ol"
            if in_list != kind:
                flush_list()
                in_list = kind
            list_items.append((m_ul or m_ol).group(1).strip())
            continue
        else:
            flush_list()
        if not s:
            flush_para()
            continue
        if in_editorial:
            editorial.append(s)
        else:
            buf.append(ln)
    flush_para(); flush_list()
    # apply internal links (first occurrence each, paragraph/list text)
    applied = []
    def linkify(text):
        for phrase, href in links:
            if phrase in text:
                text = text.replace(phrase, f"\x00{len(applied)}\x00", 1)
                applied.append((phrase, href))
        return text
    out = []
    for kind, payload in blocks:
        if kind == "p":
            t = linkify(payload)
            t = inline_md(t)
            for idx, (phrase, href) in enumerate(applied):
                t = t.replace(f"\x00{idx}\x00", f'<a href="{href}">{html.escape(phrase)}</a>')
            applied.clear()
            out.append(("p", t))
        elif kind in ("ul", "ol"):
            items = []
            for it in payload:
                t = linkify(it)
                t = inline_md(t)
                for idx, (phrase, href) in enumerate(applied):
                    t = t.replace(f"\x00{idx}\x00", f'<a href="{href}">{html.escape(phrase)}</a>')
                applied.clear()
                items.append(t)
            out.append((kind, items))
        else:
            out.append((kind, inline_md(payload)))
    return out, " ".join(editorial)

# ----------------------------------------------------------------------------
# SVG editorial visuals — original REVOLVYN assets, black/lime identity
# ----------------------------------------------------------------------------
def esc(t):
    return html.escape(t, quote=True)

def wrap_label(t, n=22):
    words, lines, cur = t.split(), [], ""
    for w in words:
        if len((cur + " " + w).strip()) > n:
            lines.append(cur.strip()); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    return lines[:3]

def make_svg(kind, kicker, title, items, sub=None, wide=True):
    W, H = (1200, 630) if wide else (880, 460)
    fs_title = 44 if wide else 34
    fs_item = 21 if wide else 18
    pad = 64 if wide else 44
    lime, card, edge, txt, mut = "#e6f578", "#141f0b", "#8cb478", "#eef3df", "#b9c9a4"
    n = len(items)
    # Finalize canvas height BEFORE emitting anything: tall inline checklists
    # grow the canvas so no row is ever clipped (featured art stays 1200x630).
    title_lines = wrap_label(title, 30 if wide else 26)
    content_top = pad + 6 + (fs_title + 14) + len(title_lines) * (fs_title + 8) + 14
    if kind == "checklist" and not wide:
        need = content_top + 4 + n * (50 + 10) + pad + 12
        if need > H:
            H = int(need)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d">']
    s.append(f"<title id=\"t\">{esc(title)}</title><desc id=\"d\">{esc(kicker + ': ' + title)}</desc>")
    s.append(f"<defs><radialGradient id=\"bg\" cx=\"50%\" cy=\"85%\" r=\"90%\"><stop offset=\"0%\" stop-color=\"#16230c\"/>"
             f"<stop offset=\"60%\" stop-color=\"#050805\"/><stop offset=\"100%\" stop-color=\"#000\"/></radialGradient>"
             f"<pattern id=\"dots\" width=\"26\" height=\"26\" patternUnits=\"userSpaceOnUse\">"
             f"<circle cx=\"2\" cy=\"2\" r=\"1.4\" fill=\"#223311\" opacity=\"0.55\"/></pattern></defs>")
    s.append(f"<rect width=\"{W}\" height=\"{H}\" fill=\"url(#bg)\"/>")
    s.append(f"<rect width=\"{W}\" height=\"{H}\" fill=\"url(#dots)\"/>")
    s.append(f"<rect x=\"1\" y=\"1\" width=\"{W-2}\" height=\"{H-2}\" fill=\"none\" stroke=\"#8cb478\" stroke-opacity=\"0.25\" stroke-width=\"2\"/>")
    y = pad + 6
    s.append(f"<text x=\"{pad}\" y=\"{y}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{15 if wide else 13}\" "
             f"letter-spacing=\"4\" fill=\"#b9d68a\">{esc(kicker.upper())}</text>")
    y += (fs_title + 14)
    for ln in title_lines:
        s.append(f"<text x=\"{pad}\" y=\"{y}\" font-family=\"Georgia, 'Playfair Display', serif\" font-size=\"{fs_title}\" fill=\"#f5fae6\">{esc(ln)}</text>")
        y += fs_title + 8
    y += 14
    if kind in ("flow", "cycle"):
        gap = 26 if wide else 18
        bw = (W - 2 * pad - gap * (n - 1)) / n
        bh = 150 if wide else 120
        yy = H - pad - bh - (34 if sub else 10)
        for k, it in enumerate(items):
            x = pad + k * (bw + gap)
            s.append(f"<rect x=\"{x:.0f}\" y=\"{yy}\" width=\"{bw:.0f}\" height=\"{bh}\" rx=\"10\" fill=\"{card}\" stroke=\"{edge}\" stroke-opacity=\"0.45\"/>")
            s.append(f"<circle cx=\"{x + 26:.0f}\" cy=\"{yy + 28}\" r=\"13\" fill=\"none\" stroke=\"{lime}\" stroke-opacity=\"0.8\" stroke-width=\"1.6\"/>")
            s.append(f"<text x=\"{x + 26:.0f}\" y=\"{yy + 34}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"15\" fill=\"{lime}\" text-anchor=\"middle\">{k+1}</text>")
            ly = yy + 62
            for ln in wrap_label(it, 16):
                s.append(f"<text x=\"{x + bw/2:.0f}\" y=\"{ly:.0f}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{fs_item}\" fill=\"{txt}\" text-anchor=\"middle\">{esc(ln)}</text>")
                ly += fs_item + 6
            if k < n - 1:
                ax = x + bw
                s.append(f"<line x1=\"{ax+4:.0f}\" y1=\"{yy+bh/2:.0f}\" x2=\"{ax+gap-4:.0f}\" y2=\"{yy+bh/2:.0f}\" stroke=\"{lime}\" stroke-width=\"2\" opacity=\"0.75\"/>")
                s.append(f"<polygon points=\"{ax+gap-4:.0f},{yy+bh/2-6:.0f} {ax+gap-4:.0f},{yy+bh/2+6:.0f} {ax+gap+2:.0f},{yy+bh/2:.0f}\" fill=\"{lime}\" opacity=\"0.85\"/>")
        if kind == "cycle":
            s.append(f"<path d=\"M {pad+40} {yy-18} H {W-pad-40} \" stroke=\"{lime}\" stroke-width=\"1.4\" stroke-dasharray=\"6 6\" fill=\"none\" opacity=\"0.5\"/>")
    elif kind == "funnel":
        top_w = W - 2 * pad - 120
        bh = 96 if wide else 74
        gap = 14
        yy = y + 6
        for k, it in enumerate(items):
            w = top_w - k * (top_w * 0.18)
            x = (W - w) / 2
            s.append(f"<rect x=\"{x:.0f}\" y=\"{yy:.0f}\" width=\"{w:.0f}\" height=\"{bh}\" rx=\"10\" fill=\"{card}\" stroke=\"{lime if k==0 else edge}\" stroke-opacity=\"{0.9 if k==0 else 0.45}\" stroke-width=\"{2 if k==0 else 1.4}\"/>")
            s.append(f"<text x=\"{W/2:.0f}\" y=\"{yy+bh/2+7:.0f}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{fs_item+1}\" fill=\"{txt}\" text-anchor=\"middle\">{esc(it)}</text>")
            yy += bh + gap
    elif kind == "split":
        assert len(items) == 2
        bw = (W - 2 * pad - 24) / 2
        bh = H - y - pad - (40 if sub else 16)
        for k, it in enumerate(items):
            x = pad + k * (bw + 24)
            s.append(f"<rect x=\"{x:.0f}\" y=\"{y:.0f}\" width=\"{bw:.0f}\" height=\"{bh:.0f}\" rx=\"12\" fill=\"{card}\" stroke=\"{edge}\" stroke-opacity=\"0.45\"/>")
            s.append(f"<rect x=\"{x:.0f}\" y=\"{y:.0f}\" width=\"{bw:.0f}\" height=\"{bh:.0f}\" rx=\"12\" fill=\"none\" stroke=\"{lime}\" stroke-opacity=\"0.25\"/>")
            ly = y + 52
            for ln in wrap_label(it, 26 if wide else 22):
                s.append(f"<text x=\"{x+28:.0f}\" y=\"{ly:.0f}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{fs_item+1}\" fill=\"{txt}\">{esc(ln)}</text>")
                ly += fs_item + 10
    elif kind == "grid":
        cols = 3 if n > 4 or wide else 2
        rows = (n + cols - 1) // cols
        gap = 18
        bw = (W - 2 * pad - gap * (cols - 1)) / cols
        bh = (H - y - pad - gap * (rows - 1) - (36 if sub else 12)) / rows
        for k, it in enumerate(items):
            r, c = divmod(k, cols)
            x = pad + c * (bw + gap)
            yy = y + r * (bh + gap)
            s.append(f"<rect x=\"{x:.0f}\" y=\"{yy:.0f}\" width=\"{bw:.0f}\" height=\"{bh:.0f}\" rx=\"10\" fill=\"{card}\" stroke=\"{edge}\" stroke-opacity=\"0.45\"/>")
            s.append(f"<circle cx=\"{x+24:.0f}\" cy=\"{yy+26:.0f}\" r=\"4\" fill=\"{lime}\" opacity=\"0.9\"/>")
            ly = yy + 30
            for ln in wrap_label(it, 20):
                s.append(f"<text x=\"{x+42:.0f}\" y=\"{ly:.0f}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{fs_item}\" fill=\"{txt}\">{esc(ln)}</text>")
                ly += fs_item + 6
    elif kind == "checklist":
        rh_default, gap = (62, 10) if wide else (50, 10)
        items_c = items  # canvas already sized; never drop rows
        if wide:
            avail = H - y - pad - (36 if sub else 12)
            rh = min(rh_default, (avail - gap * (len(items_c) - 1)) / len(items_c))
            fs = fs_item if rh >= 52 else max(14, int(fs_item * rh / 52))
        else:
            rh, fs = rh_default, fs_item
        yy = y + 4
        for k, it in enumerate(items_c):
            s.append(f"<rect x=\"{pad}\" y=\"{yy:.0f}\" width=\"{W-2*pad}\" height=\"{rh:.0f}\" rx=\"9\" fill=\"{card}\" stroke=\"{edge}\" stroke-opacity=\"0.4\"/>")
            bx = pad + 20
            s.append(f"<rect x=\"{bx}\" y=\"{yy+rh/2-10:.0f}\" width=\"20\" height=\"20\" rx=\"5\" fill=\"none\" stroke=\"{lime}\" stroke-width=\"1.8\" opacity=\"0.9\"/>")
            s.append(f"<polyline points=\"{bx+4},{yy+rh/2:.0f} {bx+8.5},{yy+rh/2+4.5:.0f} {bx+16},{yy+rh/2-5:.0f}\" fill=\"none\" stroke=\"{lime}\" stroke-width=\"2\"/>")
            s.append(f"<text x=\"{bx+34}\" y=\"{yy+rh/2+6:.0f}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{fs if wide else fs_item}\" fill=\"{txt}\">{esc(it[:72])}</text>")
            yy += rh + gap
    if sub:
        s.append(f"<text x=\"{pad}\" y=\"{H-pad+2}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"{15 if wide else 13}\" fill=\"{mut}\">{esc(sub[:110])}</text>")
    s.append(f"<text x=\"{W-pad}\" y=\"{H-pad+2}\" font-family=\"Inter, Arial, sans-serif\" font-size=\"13\" fill=\"#6f8459\" text-anchor=\"end\">REVOLVYN</text>")
    s.append("</svg>")
    return "\n".join(s), H

# ----------------------------------------------------------------------------
# Page chrome — extracted from the live blog.html so nav/footer stay identical
# ----------------------------------------------------------------------------
def load_chrome():
    # research.html carries the same site chrome (nav/footer/scripts/style) and is
    # never modified by this builder, so regeneration stays idempotent.
    src = (REPO / "research.html").read_text(encoding="utf-8")
    head_top = src.split("<style>")[0]
    style = src.split("<style>")[1].split("</style>")[0]
    nav = src[src.index('<nav class="nav-float">'):src.index('<section class="page-hero">')]
    footer = src[src.index('<footer class="site-footer">'):src.index("</footer>") + len("</footer>")]
    script = src[src.index("\t<script>") + len("\t<script>"):src.index("</script>", src.index("\t<script>"))]
    return head_top, style, nav, footer, script

EXTRA_CSS = """
.blog-index{max-width:1100px;margin:0 auto;padding:10px 40px 90px}
.chips{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:26px 0 34px}
.chip{background:transparent;border:1px solid rgba(140,180,120,.22);color:rgba(215,230,190,.75);font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:9px 18px;border-radius:999px;cursor:pointer;font-family:'Inter',system-ui,sans-serif;transition:all .3s}
.chip:hover{border-color:rgba(230,245,120,.5);color:rgba(230,245,120,.95)}
.chip.on{background:rgba(230,245,120,.12);border-color:rgba(230,245,120,.6);color:rgba(230,245,120,.95)}
.blog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.blog-card{display:flex;flex-direction:column;background:rgba(20,30,10,.3);border:1px solid rgba(140,180,120,.1);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;transition:border-color .3s,transform .3s}
.blog-card:hover{border-color:rgba(140,180,120,.3);transform:translateY(-3px)}
.blog-card img{width:100%;height:auto;aspect-ratio:1200/630;display:block;background:#0a0f06}
.blog-card-body{padding:22px;display:flex;flex-direction:column;gap:10px;flex:1}
.blog-cat{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(230,245,120,.75);font-weight:500}
.blog-card h2{font-family:'Playfair Display',serif;font-size:19px;line-height:1.35;color:rgba(248,252,240,.93);margin:0;padding:0;border:none}
.blog-card p{font-size:12.5px;line-height:1.7;color:rgba(215,230,190,.68);margin:0}
.blog-meta{display:flex;gap:10px;font-size:11px;color:rgba(215,230,190,.5);margin-top:auto;padding-top:8px}
.blog-cta-line{margin-top:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(230,245,120,.8)}
.blog-card.hide{display:none}
.crumb{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(215,230,190,.5);margin-bottom:18px}
.crumb a{color:rgba(215,230,190,.65);text-decoration:none}
.crumb a:hover{color:rgba(230,245,120,.9)}
.article-wrap{max-width:780px;margin:0 auto;padding:130px 40px 30px}
.art-kicker{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(230,245,120,.8);font-weight:500;margin-bottom:14px}
.article-wrap h1{font-family:'Playfair Display',serif;font-size:clamp(30px,4.6vw,46px);line-height:1.2;color:rgba(248,252,240,.96);letter-spacing:.5px;margin-bottom:16px}
.deck{font-size:16px;line-height:1.75;color:rgba(215,230,190,.85);font-weight:300;margin-bottom:26px}
.art-hero{margin:0 0 18px;border:1px solid rgba(140,180,120,.14);border-radius:12px;overflow:hidden}
.art-hero img{width:100%;height:auto;display:block;background:#0a0f06}
.art-meta{font-size:12px;color:rgba(215,230,190,.55);margin-bottom:8px}
.art-meta time{color:rgba(215,230,190,.75)}
.art-body{font-size:15px;line-height:1.85;color:rgba(224,232,208,.82);font-weight:300}
.art-body p{margin:0 0 18px}
.art-body h2{font-family:'Playfair Display',serif;font-size:clamp(21px,3vw,27px);color:rgba(248,252,240,.93);margin:40px 0 14px;padding-top:28px;border-top:1px solid rgba(140,180,120,.1);letter-spacing:.4px}
.art-body h3{font-size:14px;font-weight:500;color:rgba(230,245,120,.8);margin:20px 0 10px}
.art-body ul,.art-body ol{margin:6px 0 20px;padding-left:22px}
.art-body li{margin-bottom:9px;line-height:1.75}
.art-body ul li::marker{color:rgba(230,245,120,.6)}
.art-body a{color:rgba(230,245,120,.9);text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(230,245,120,.35)}
.art-body a:hover{color:rgba(240,255,140,1)}
.art-body strong{color:rgba(248,252,240,.92);font-weight:600}
.art-fig{margin:30px 0;border:1px solid rgba(140,180,120,.14);border-radius:12px;overflow:hidden;background:#070b04}
.art-fig img{width:100%;height:auto;display:block}
.art-fig figcaption{font-size:12px;line-height:1.65;color:rgba(215,230,190,.6);padding:12px 18px;border-top:1px solid rgba(140,180,120,.1)}
.ed-note{font-size:12.5px;line-height:1.75;color:rgba(215,230,190,.55);border-top:1px solid rgba(140,180,120,.1);margin-top:36px;padding-top:18px;font-style:italic}
.svc-box{background:rgba(20,30,10,.4);border:1px solid rgba(140,180,120,.16);border-radius:12px;padding:26px 28px;margin:38px 0}
.svc-box h2{font-family:'Playfair Display',serif;font-size:20px;color:rgba(248,252,240,.92);margin:0 0 10px;padding:0;border:none}
.svc-box p{font-size:13.5px;line-height:1.8;color:rgba(215,230,190,.75);margin:0}
.svc-box a{color:rgba(230,245,120,.9)}
.related{margin:20px 0 10px}
.related h2{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,30px);color:rgba(248,252,240,.93);margin-bottom:20px}
.related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.cta-band{text-align:center;border:1px solid rgba(140,180,120,.16);border-radius:14px;padding:46px 30px;margin:44px 0 70px;background:radial-gradient(ellipse at 50% 120%,rgba(30,50,12,.45),transparent 70%)}
.cta-band h2{font-family:'Playfair Display',serif;font-size:clamp(22px,3.4vw,30px);color:rgba(248,252,240,.94);margin-bottom:12px}
.cta-band p{font-size:13.5px;line-height:1.8;color:rgba(215,230,190,.72);max-width:560px;margin:0 auto 24px}
.explore-rv{max-width:1100px;margin:10px auto 0;padding:56px 0 8px;border-top:1px solid rgba(140,180,120,.1);text-align:center}
.explore-rv .seo-label{display:block;margin-bottom:12px}
.explore-rv h2{font-family:'Playfair Display',serif;font-size:clamp(22px,3.2vw,30px);color:rgba(248,252,240,.92);margin-bottom:8px;letter-spacing:.5px}
.explore-rv p{font-size:13px;line-height:1.8;color:rgba(215,230,190,.68);font-weight:300;max-width:560px;margin:0 auto 30px}
.explore-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0 32px;max-width:760px;margin:0 auto;text-align:left}
.explore-grid a{display:flex;align-items:baseline;justify-content:space-between;gap:16px;text-decoration:none;padding:15px 4px;border-bottom:1px solid rgba(140,180,120,.1);transition:border-color .3s}
.explore-grid a span:first-child{font-family:'Playfair Display',serif;font-size:17px;color:rgba(240,250,230,.85)}
.explore-grid a span:last-child{font-size:14px;color:rgba(230,245,120,.55);transition:transform .3s,color .3s}
.explore-grid a:hover{border-bottom-color:rgba(230,245,120,.45)}
.explore-grid a:hover span:first-child{color:rgba(248,252,240,.97)}
.explore-grid a:hover span:last-child{color:rgba(230,245,120,.95);transform:translateX(4px)}
@media(max-width:640px){.explore-grid{grid-template-columns:1fr}}
.cta-btn{display:inline-block;background:rgba(230,245,120,.92);color:#0a0f06;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:15px 34px;border-radius:999px;transition:background .3s}
.cta-btn:hover{background:rgba(240,255,150,1)}
@media(max-width:900px){.blog-grid{grid-template-columns:repeat(2,1fr)}.related-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.blog-index{padding:10px 20px 70px}.blog-grid{grid-template-columns:1fr}.related-grid{grid-template-columns:1fr}.article-wrap{padding:110px 20px 20px}.art-body{font-size:14.5px}}
"""

def fmt_date(iso):
    dt = datetime.strptime(iso, "%Y-%m-%d")
    return dt.strftime("%-d %B %Y") if sys.platform != "win32" else dt.strftime("%#d %B %Y")

def rfc822(iso):
    return datetime.strptime(iso, "%Y-%m-%d").strftime("%a, %d %b %Y 09:00:00 +0530")

def head_for(head_top, *, title, desc, canonical, og_type="website", image=None,
             extra_meta="", jsonlds=None):
    h = head_top
    h = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", h, count=1)
    h = re.sub(r'<link rel="canonical" href="[^"]*" />',
               f'<link rel="canonical" href="{canonical}" />', h, count=1)
    h = re.sub(r'<meta name="description" content="[^"]*" />',
               f'<meta name="description" content="{esc(desc)}" />', h, count=1)
    h = re.sub(r'<meta property="og:type" content="[^"]*" />',
               f'<meta property="og:type" content="{og_type}" />', h, count=1)
    for prop in ["og:title", "twitter:title"]:
        key = "property" if prop.startswith("og") else "name"
        h = re.sub(rf'<meta {key}="{prop}" content="[^"]*" />',
                   f'<meta {key}="{prop}" content="{esc(title)}" />', h, count=1)
    for prop in ["og:description", "twitter:description"]:
        key = "property" if prop.startswith("og") else "name"
        h = re.sub(rf'<meta {key}="{prop}" content="[^"]*" />',
                   f'<meta {key}="{prop}" content="{esc(desc)}" />', h, count=1)
    h = re.sub(r'<meta property="og:url" content="[^"]*" />',
               f'<meta property="og:url" content="{canonical}" />', h, count=1)
    if image:
        h = re.sub(r'<meta property="og:image" content="[^"]*" />',
                   f'<meta property="og:image" content="{image}" />', h, count=1)
        h = re.sub(r'<meta name="twitter:image" content="[^"]*" />',
                   f'<meta name="twitter:image" content="{image}" />', h, count=1)
        h = re.sub(r'<meta property="og:image:alt" content="[^"]*" />',
                   f'<meta property="og:image:alt" content="{esc(title)}" />', h, count=1)
    h = re.sub(r'<meta name="robots" content="[^"]*" />',
               '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
               h, count=1)
    h = re.sub(r'<link rel="alternate" hreflang="en" href="[^"]*" />',
               f'<link rel="alternate" hreflang="en" href="{canonical}" />', h, count=1)
    h = re.sub(r'<link rel="alternate" hreflang="x-default" href="[^"]*" />',
               f'<link rel="alternate" hreflang="x-default" href="{canonical}" />', h, count=1)
    # swap WebPage JSON-LD + org block preserved; append article schemas
    h = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema\.org","@type":"WebPage".*?</script>',
               (jsonlds or ""), h, count=1, flags=re.DOTALL)
    if extra_meta:
        h = h.replace("</head>", extra_meta + "\n</head>", 1) if "</head>" in h else h + extra_meta
    return h

def article_jsonld(a, url, img):
    posting = {
     "@context": "https://schema.org", "@type": "BlogPosting",
     "headline": a["title"].split(" | REVOLVYN")[0],
     "description": a["desc"],
     "image": [img],
     "datePublished": a["date"],
     "author": {"@type": "Organization", "name": "REVOLVYN", "url": SITE + "/"},
     "publisher": {"@id": ORG_ID},
     "mainEntityOfPage": {"@type": "WebPage", "@id": url},
     "articleSection": a["cat"], "inLanguage": "en",
    }
    crumb = {"@context": "https://schema.org", "@type": "BreadcrumbList",
      "itemListElement": [
       {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
       {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog.html"},
       {"@type": "ListItem", "position": 3, "name": a["title"].split(" | REVOLVYN")[0], "item": url}]}
    # NOTE: the Organization identity (@id https://revolvynmedia.com/#business) is
    # already present in the page head chrome — it is referenced, not repeated.
    return (f'<script type="application/ld+json">{json.dumps(posting, ensure_ascii=False)}</script>\n  '
            f'<script type="application/ld+json">{json.dumps(crumb, ensure_ascii=False)}</script>')

def build():
    head_top, style, nav, footer, script = load_chrome()
    full_style = style + EXTRA_CSS
    bodies = {}
    for a in ARTICLES:
        raw = (SRC_DIR / a["file"]).read_text(encoding="utf-8")
        bodies[a["slug"]] = convert_body(raw, a["links"])
        # link-coverage check: every configured phrase must occur in the source
        for phrase, _href in a["links"]:
            assert phrase in CITE_RE.sub("", raw), f"link phrase missing in {a['file']}: {phrase!r}"
    # ---- 1. SVG assets -----------------------------------------------------
    assets = REPO / "blog" / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    inline_h = {}
    for a in ARTICLES:
        kind, kicker, ftitle, items, alt = a["feat"][:5]
        sub = a["feat"][5] if len(a["feat"]) > 5 else None
        svg, _h = make_svg(kind, kicker, ftitle, items, sub, wide=True)
        (assets / f'featured-{a["slug"]}.svg').write_text(svg, encoding="utf-8")
        for ord_, kind2, k2, t2, items2, _alt, cap in a["figs"]:
            fname = f'inline-{a["slug"]}-{ord_}.svg'
            svg2, h2 = make_svg(kind2, k2, t2, items2, None, wide=False)
            (assets / fname).write_text(svg2, encoding="utf-8")
            inline_h[(a["slug"], ord_)] = h2
    # ---- 2. Article pages --------------------------------------------------
    for a in ARTICLES:
        slug, url = a["slug"], f"{SITE}/blog/{a['slug']}/"
        img = f"{SITE}/blog/assets/featured-{slug}.svg"      # on-page visual (unchanged)
        img_png = f"{SITE}/blog/assets/featured-{slug}.png"  # social preview only
        blocks, editorial = bodies[slug]
        # map h2 ordinal -> figure html
        fig_by_ord = {}
        for ord_, kind2, k2, t2, items2, alt, cap in a["figs"]:
            ih = inline_h[(slug, ord_)]
            fig_by_ord[ord_] = (
                f'<figure class="art-fig"><img src="../assets/inline-{slug}-{ord_}.svg" width="880" height="{ih}" '
                f'loading="lazy" alt="{esc(alt)}"><figcaption>{esc(cap)}</figcaption></figure>')
        parts, h2i = [], -1
        for kind, payload in blocks:
            if kind == "h2":
                h2i += 1
                parts.append(f"<h2>{payload}</h2>")
                # figures render after the first paragraph following their H2;
                # simplest faithful anchor: directly after the heading's next block
                parts.append(f"%%FIG{h2i}%%")
            elif kind == "p":
                parts.append(f"<p>{payload}</p>")
            elif kind == "ul":
                parts.append("<ul>" + "".join(f"<li>{x}</li>" for x in payload) + "</ul>")
            elif kind == "ol":
                parts.append("<ol>" + "".join(f"<li>{x}</li>" for x in payload) + "</ol>")
            elif kind == "h3":
                parts.append(f"<h3>{payload}</h3>")
        html_body = "\n".join(parts)
        # place each figure after the first paragraph that follows its H2
        for ord_, fig in fig_by_ord.items():
            marker = f"%%FIG{ord_}%%"
            if marker in html_body:
                nxt = html_body.find("</p>", html_body.find(marker))
                if nxt != -1:
                    html_body = html_body.replace(marker, "", 1)
                    html_body = html_body[:nxt + 4] + "\n" + fig + html_body[nxt + 4:]
                else:
                    html_body = html_body.replace(marker, fig, 1)
            else:  # fallback: append before editorial
                html_body += "\n" + fig
        html_body = re.sub(r"%%FIG\d+%%", "", html_body)
        if editorial:
            html_body += f'\n<p class="ed-note">Editorial note \u2014 {inline_md(editorial)}</p>'
        # related cards
        rel_cards = []
        for r in a["related"]:
            b = BY_SLUG[r]
            rel_cards.append(
                f'<a class="blog-card" href="../{r}/"><img src="../assets/featured-{r}.svg" width="1200" height="630" '
                f'loading="lazy" alt="{esc(b["feat"][4])}"><div class="blog-card-body">'
                f'<span class="blog-cat">{esc(b["cat"])}</span><h2>{esc(b["title"].split(" | REVOLVYN")[0])}</h2>'
                f'<div class="blog-meta"><span>{fmt_date(b["date"])}</span><span>\u00b7</span><span>{b["read"]} min read</span></div>'
                f'<span class="blog-cta-line">Read article \u2192</span></div></a>')
        cta_h, cta_p = CTA_COPY[a["cta"]]
        page = f"""<!DOCTYPE html>
<html lang="en">
<head>
{head_for(head_top, title=a["title"], desc=a["desc"], canonical=url, og_type="article",
          image=img_png, jsonlds=article_jsonld(a, url, img),
          extra_meta=(f'  <meta property="article:published_time" content="{a["date"]}" />\n'
                       f'  <meta property="article:section" content="{esc(a["cat"])}" />\n'
                       f'  <meta property="article:publisher" content="{SITE}/" />'))}
  <style>{full_style}
</style>
</head>
<body>
  <noscript><div class="noscript-list"><h2>{esc(a["title"].split(" | REVOLVYN")[0])}</h2><p>{esc(a["deck"])}</p><p><a href="../../index.html">Home</a> \u00b7 <a href="../../blog.html">Blog</a> \u00b7 <a href="../../contact.html">Contact</a></p></div></noscript>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="page-transition" id="pageTransition"></div>
{relativize(nav)}
  <main class="article-wrap" id="main">
    <article>
      <nav class="crumb" aria-label="Breadcrumb"><a href="../../index.html">Home</a> <span>/</span> <a href="../../blog.html">Blog</a> <span>/</span> <span aria-current="page">{esc(short_crumb(a["title"]))}</span></nav>
      <p class="art-kicker">{esc(a["cat"])} \u00b7 {a["read"]} min read</p>
      <h1>{esc(a["title"].split(" | REVOLVYN")[0])}</h1>
      <p class="deck">{esc(a["deck"])}</p>
      <figure class="art-hero"><img src="../assets/featured-{slug}.svg" width="1200" height="630" fetchpriority="high" alt="{esc(a["feat"][4])}"></figure>
      <p class="art-meta">By REVOLVYN \u00b7 <time datetime="{a["date"]}">{fmt_date(a["date"])}</time> \u00b7 {a["read"]} min read</p>
      <div class="art-body">
{html_body}
      </div>
      <aside class="svc-box" aria-label="How this connects to REVOLVYN services"><h2>How this connects to REVOLVYN</h2><p>{a["svc"]}</p></aside>
      <section class="related" aria-label="Related articles"><h2>Related articles</h2><div class="related-grid">
{"".join(rel_cards)}
      </div></section>
      <section class="cta-band"><h2>{esc(cta_h)}</h2><p>{esc(cta_p)}</p><a class="cta-btn" href="../../contact.html">Contact REVOLVYN</a></section>
    </article>
  </main>
{relativize(footer)}
  <script>{relativize(script)}</script>
</body>
</html>
"""
        out = REPO / "blog" / slug / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
    # ---- 3. Blog index ------------------------------------------------------
    cards = []
    for a in ARTICLES:
        cards.append(
            f'<a class="blog-card" href="blog/{a["slug"]}/" data-cat="{esc(a["cat"])}">'
            f'<img src="blog/assets/featured-{a["slug"]}.svg" width="1200" height="630" loading="lazy" alt="{esc(a["feat"][4])}">'
            f'<div class="blog-card-body"><span class="blog-cat">{esc(a["cat"])}</span>'
            f'<h2>{esc(a["title"].split(" | REVOLVYN")[0])}</h2><p>{esc(a["deck"])}</p>'
            f'<div class="blog-meta"><span>{fmt_date(a["date"])}</span><span>\u00b7</span><span>{a["read"]} min read</span></div>'
            f'<span class="blog-cta-line">Read article \u2192</span></div></a>')
    cats = sorted({a["cat"] for a in ARTICLES})
    chips = ['<button class="chip on" data-f="All">All</button>'] + \
            [f'<button class="chip" data-f="{esc(c)}">{esc(c)}</button>' for c in cats]
    item_list = {"@context": "https://schema.org", "@type": "Blog",
     "name": "REVOLVYN Blog", "url": f"{SITE}/blog.html",
     "blogPost": [{"@type": "BlogPosting", "headline": a["title"].split(" | REVOLVYN")[0],
                   "url": f"{SITE}/blog/{a['slug']}/", "datePublished": a["date"],
                   "image": f"{SITE}/blog/assets/featured-{a['slug']}.svg"} for a in ARTICLES]}
    blog_ld = f'<script type="application/ld+json">{json.dumps(item_list, ensure_ascii=False)}</script>'
    blog_page = f"""<!DOCTYPE html>
<html lang="en">
<head>
{head_for(head_top, title="Blog: Growth, Ads & Creator Marketing Playbooks | REVOLVYN",
          desc="18 practical playbooks on performance marketing, Meta ads, creators, content, SEO and growth strategy \u2014 written for growing brands. New from REVOLVYN.",
          canonical=f"{SITE}/blog.html", jsonlds=blog_ld)}
  <style>{full_style}
</style>
</head>
<body>
  <noscript><div class="noscript-list"><h2>Blog: Growth, Ads &amp; Creator Marketing Playbooks</h2><p>Eighteen practical playbooks on Meta ads, influencer marketing, content and growth.</p><p><a href="index.html">Home</a> \u00b7 <a href="newsletter.html">Newsletter</a> \u00b7 <a href="research.html">Research</a></p></div></noscript>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="page-transition" id="pageTransition"></div>
{nav}
  <section class="page-hero"><h1>Growth &amp; Marketing Playbooks</h1>
    <p>Eighteen practical guides on performance marketing, Meta ads, creators, content, SEO and growth strategy \u2014 written for growing brands, connected to the work we do every day.</p>
  </section>
  <div class="blog-index" id="main">
    <div class="chips" role="group" aria-label="Filter articles by topic">
      {"".join(chips)}
    </div>
    <div class="blog-grid">
{"".join(cards)}
    </div>
    <section class="explore-rv" aria-label="Explore REVOLVYN services"><span class="seo-label">Explore REVOLVYN</span><h2>Where to go next</h2><p>The teams and services behind these playbooks \u2014 one roof, one reporting line.</p><div class="explore-grid">
      <a href="services.html#performance-marketing"><span>Performance Marketing</span><span aria-hidden="true">\u2192</span></a>
      <a href="services.html#website-seo"><span>Website + SEO</span><span aria-hidden="true">\u2192</span></a>
      <a href="services.html#content-production"><span>Content Production</span><span aria-hidden="true">\u2192</span></a>
      <a href="services.html#influencer-marketing"><span>Influencer &amp; Creator Marketing</span><span aria-hidden="true">\u2192</span></a>
      <a href="services.html#ai-content"><span>AI Content &amp; Creative Automation</span><span aria-hidden="true">\u2192</span></a>
      <a href="services.html#growth-consulting"><span>Growth Consulting</span><span aria-hidden="true">\u2192</span></a>
    </div></section>
    <section class="cta-band"><h2>Want the next playbook first?</h2><p>One practical growth tactic in your inbox \u2014 no spam, unsubscribe anytime.</p><a class="cta-btn" href="newsletter.html">Subscribe to the newsletter</a></section>
  </div>
{footer}
  <script>{script}
    document.querySelectorAll('.chip').forEach(function(ch){{ch.addEventListener('click',function(){{
      document.querySelectorAll('.chip').forEach(function(c){{c.classList.remove('on')}});
      ch.classList.add('on');
      var f=ch.getAttribute('data-f');
      document.querySelectorAll('.blog-card').forEach(function(card){{
        card.classList.toggle('hide', f!=='All' && card.getAttribute('data-cat')!==f);
      }});
    }})}});
  </script>
</body>
</html>
"""
    (REPO / "blog.html").write_text(blog_page, encoding="utf-8")
    # ---- 4. Sitemap (idempotent: drop previously generated blog entries first) --
    sm = (REPO / "sitemap.xml").read_text(encoding="utf-8")
    sm = "\n".join(ln for ln in sm.split("\n") if "/blog" not in ln)
    entries = [f'  <url><loc>{SITE}/blog.html</loc><lastmod>2026-10-01</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>']
    for a in ARTICLES:
        entries.append(
            f'  <url><loc>{SITE}/blog/{a["slug"]}/</loc><lastmod>{a["date"]}</lastmod><changefreq>monthly</changefreq>'
            f'<priority>0.6</priority><image:image><image:loc>{SITE}/blog/assets/featured-{a["slug"]}.svg</image:loc>'
            f'<image:title>{esc(a["title"].split(" | REVOLVYN")[0])}</image:title></image:image></url>')
    sm = sm.replace("</urlset>", "\n".join(entries) + "\n</urlset>")
    (REPO / "sitemap.xml").write_text(sm, encoding="utf-8")
    # ---- 5. Feed (idempotent: drop previously generated blog items first) -----
    # Article item links look like .../blog/<slug>/ (trailing slash). The original
    # blog.html channel item (.../blog.html) contains no "/blog/" and is preserved.
    feed = (REPO / "feed.xml").read_text(encoding="utf-8")
    kept = []
    for blk in re.split(r"(    <item>.*?    </item>\n)", feed, flags=re.DOTALL):
        m = re.search(r"<link>(.*?)</link>", blk)
        if m and "/blog/" in m.group(1):
            continue
        kept.append(blk)
    feed = "".join(kept)
    items = []
    for a in ARTICLES:
        items.append(
            f"""    <item>
      <title>{esc(a["title"].split(" | REVOLVYN")[0])}</title>
      <link>{SITE}/blog/{a["slug"]}/</link>
      <guid isPermaLink="true">{SITE}/blog/{a["slug"]}/</guid>
      <description>{esc(a["deck"])}</description>
      <pubDate>{rfc822(a["date"])}</pubDate>
    </item>""")
    feed = feed.replace("<lastBuildDate>Tue, 29 Sep 2026 00:00:00 +0530</lastBuildDate>",
                        "<lastBuildDate>Thu, 01 Oct 2026 09:00:00 +0530</lastBuildDate>")
    feed = feed.replace("  </channel>", "\n".join(items) + "\n  </channel>")
    (REPO / "feed.xml").write_text(feed, encoding="utf-8")
    # ---- 6. Image provenance -------------------------------------------------
    lines = ["# Blog image sources", "",
     "All blog visuals are **original editorial SVGs created for REVOLVYN** (black/lime identity, no photography,",
     "no stock, no third-party assets, no client likenesses). Owned by REVOLVYN \u2014 no attribution or licence renewal required.", "",
     "Each featured SVG has a pixel-identical PNG twin (`featured-<slug>.png`, 1200x630, rendered from the same SVG",
     "in Chromium via `scripts/make-og-png.py`) used **only** for `og:image` / `twitter:image` social previews.",
     "On-page article visuals remain the SVGs.", "",
     "| Article | Featured visual | Inline visual(s) |", "|---|---|---|"]
    for a in ARTICLES:
        inl = ", ".join(f'`blog/assets/inline-{a["slug"]}-{o}.svg` ({k})' for o, k, *_r in a["figs"])
        lines.append(f'| `{a["slug"]}` | `blog/assets/featured-{a["slug"]}.svg` ({a["feat"][0]}) | {inl} |')
    (REPO / "blog" / "IMAGE_SOURCES.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK: {len(ARTICLES)} articles, {sum(1+len(a['figs']) for a in ARTICLES)} SVGs")

def short_crumb(title):
    t = title.split(" | REVOLVYN")[0]
    return t if len(t) <= 60 else t[:57] + "\u2026"

def relativize(s):
    for p in ["index.html", "portfolio.html", "brands.html", "services.html", "contact.html",
              "privacy.html", "refund.html", "research.html", "blog.html", "community.html",
              "newsletter.html", "partnerships.html", "careers.html"]:
        s = s.replace(f"'{p}'", f"'../../{p}'").replace(f'"{p}"', f'"../../{p}"')
        s = s.replace(f'"{p}#', f'"../../{p}#').replace(f"'{p}#", f"'../../{p}#")
    return s

if __name__ == "__main__":
    build()
