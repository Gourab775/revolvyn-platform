# REVOLVYN — Next-Gen Digital Marketing Showcase

Live Demo: https://revolvyn-site.vercel.app

Category: Creative Agency / Brand Showcase Platform

Stack: HTML5 · CSS3 · JavaScript (ES Modules) · Three.js (WebGPU/TSL) · Google Apps Script

## Overview

REVOLVYN is a high-impact marketing agency website that blends cinematic storytelling with immersive 3D. The landing experience renders a 120,000-blade interactive grass field via Three.js WebGPU (TSL) that responds to mouse movement, scroll-driven camera choreography, and wind dynamics — while remaining performant on mobile and low-end devices.

Beyond the hero, it is a complete multi-page business platform: portfolio, brands, services, contact, careers, partnerships, blog, research and legal pages, backed by a Google Apps Script integration for lead handling. The implementation is framework-free, fully static, and deployable to any CDN.

## Features

- **Immersive WebGPU Field** — 120k instanced grass blades with TSL compute shaders, depth-of-field, fog, wind turbulence, and mouse/camera push spheres
- **Scroll-Driven Narrative** — Section-keyframed camera paths, reveal animations, parallax, and marquee brand reel tied to scroll progress
- **Complete Business Site** — `index`, `portfolio`, `brands`, `services`, `contact`, `careers`, `partnerships`, `blog`, `privacy`, `refund`, and video pages with shared responsive nav/footer
- **Performance-Optimized** — Adaptive DPR, frustum culling, intersection observers for video GPU promotion, high-performance WebGPU context with low-end fallback
- **Responsive & Accessible** — Floating nav with hamburger overlay, mobile-tuned typography, reduced-motion support, optimized media loading

## Tech Stack

| Layer | Technology |
|-------|------------|
| Rendering | Three.js 0.183 (WebGPU, TSL), DepthOfField (DoF) node |
| Frontend | Vanilla HTML5 / CSS3 / ES Modules, Import Maps |
| Typography | Inter, Playfair Display (Google Fonts) |
| Media | Wix-hosted MP4 portfolio reels, brand logo assets |
| Integrations | Google Apps Script (`google-apps-script/`) for forms |
| Hosting | Static (GitHub Pages / Vercel — `vercel.json` included) |

## Project Structure

```
REVOLVYN/
├── index.html              # Immersive landing + field canvas + scroll narrative
├── portfolio.html          # Portfolio grid
├── brands.html             # Brands showcase
├── services.html           # Services detail
├── contact.html            # Contact / lead form
├── careers.html / partnerships.html / blog.html / research.html / newsletter.html
├── privacy.html / refund.html / community.html / video.html
├── brand logos/            # Brand mark assets
├── google-apps-script/     # Apps Script endpoint for form submissions
├── favicon.png
├── vercel.json             # Vercel static config
└── .playwright-mcp/        # Local tooling
```

## Getting Started

No build step — static site.

```bash
# Serve locally (any static server)
npx serve .
# or
python -m http.server 8000
# then open http://localhost:3000 or http://localhost:8000
```

Requirements: modern browser with WebGPU/WebGL2 for the field effect; gracefully degrades with `powerPreference` and low-end detection (`deviceMemory`, `hardwareConcurrency`, mobile UA).

## Deployment

Static output — copy the repository to any host:

- **GitHub Pages** — Push to `main`, enable Pages (root). Live at https://revolvyn-site.vercel.app
- **Vercel** — Import repo; `vercel.json` handles routing (`{"rewrites":[{"source":"/(.*)","destination":"/$1"}]}`-style)
- **Netlify / EdgeOne Pages / S3 + CloudFront** — Drag-and-drop or `npx serve` build not required

No environment variables required for the frontend; configure the Google Apps Script URL in `google-apps-script/` / `contact.html` if forking form handling.

## Customization

- **Content** — Edit section markup in `index.html` (`#scroll-container` stages) and sibling pages; brand copy in hero/manifesto/quote/CTA blocks
- **Field Look** — Tune TSL uniforms in the `<script type="module">` block of `index.html` (`BLADE_COUNT`, `FIELD_SIZE`, colors, fog, wind, mouse radii)
- **Camera** — Adjust scroll keyframes (stage definitions) and DoF uniforms (`focusDistanceU`, `focalLengthU`, `bokehScaleU`)
- **Media** — Replace Wix MP4 `src` in `.portfolio-item video` and `brand logos/` images
- **Forms** — Point `contact.html` fetch to your own Apps Script deployment or API
- **Styles** — Global CSS in `<style>` of each page; shared footer/nav in `site-footer` / `nav-float`

## License

MIT — free for personal and commercial use.
