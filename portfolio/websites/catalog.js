(function () {
	'use strict';

	window.REVOLVYN_WEBSITES = [
		{
			slug: 'amber-skincare',
			title: 'AMBER',
			fullTitle: 'AMBER — E-Commerce Storefront',
			category: 'Next.js · Shopify Storefront',
			userSummary: 'A complete online skincare store built so shoppers can inspect clean ingredients, pick products effortlessly, and check out in seconds on any phone or desktop.',
			bestFor: 'Skincare, wellness & direct-to-consumer beauty brands',
			userActions: 'Inspect ingredients, add items to slide-out cart, adjust quantities, subscribe for offers',
			usability: 'Fast mobile thumb navigation with instant cart feedback',
			siteFeatures: [
				'Product catalog with instant add-to-bag, slide-out cart drawer, and live quantity updates',
				'Dedicated ingredients spotlight, trust badges, and verified customer review sections',
				'Clear before-and-after skincare benefits organized for quick shopper decisions',
				'Full-width editorial showcase sections built for skincare product discovery',
				'Built-in newsletter signup, brand impact story, and easy FAQ answers',
				'Thumb-friendly mobile shopping bar and fast checkout transition'
			],
			techSummary: 'Built with Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI primitives, and Shopify Storefront API integration.',
			techFeatures: [
				'Shopify Storefront API data fetching layer with typed catalog & collection queries',
				'React Context global shopping cart state with persistent drawer, quantity & checkout actions',
				'Modular Radix UI accessible dialogs, accordions, tabs, and toast notification system',
				'Responsive Tailwind CSS v4 design tokens with dynamic Recharts analytics utilities'
			],
			stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Radix UI', 'Shopify API'],
			scrollHeight: 10609,
			durationSec: 11.6,
			video: 'portfolio/websites/amber-skincare.mp4',
			thumb: 'portfolio/websites/thumbs/amber-skincare.jpg',
			liveUrl: 'https://amber-skincare.vercel.app'
		},
		{
			slug: 'bakery-store',
			title: "L'\u00c9TOILE",
			fullTitle: "L'\u00c9TOILE — Interactive Storefront App",
			category: 'Next.js · Framer Motion',
			userSummary: 'An interactive bakery storefront that lets customers customize cakes, browse daily menu items, and place or schedule orders online without phone calls.',
			bestFor: 'Bakeries, cafes & food brands taking custom orders online',
			userActions: 'Build custom cakes, filter menu categories, search items, book orders',
			usability: 'Live price updates and smooth mobile menu browsing',
			siteFeatures: [
				'Custom cake builder letting buyers pick flavors, sizes, and see live price updates',
				'Online storefront menu with category browsing, search, and slide-out shopping cart',
				'Dedicated custom cake booking, order tracking & store visit pages',
				'Clear dietary, allergen, and pickup timing info right where customers order',
				'Direct gift box and catering inquiry options for special events',
				'Smooth page animations and mobile-friendly ordering layout'
			],
			techSummary: 'Built with Next.js App Router, React, TypeScript, Framer Motion, Tailwind CSS, and accessible Radix UI components.',
			techFeatures: [
				'Dynamic multi-step product & flavor configurator with real-time price delta calculation',
				'Framer Motion scroll-triggered section choreography and card micro-interactions',
				'Client-side cart state management with Sonner toast feedback & variant filtering',
				'Responsive multi-breakpoint grid with Radix UI dialogs, tabs & form controls'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Framer Motion', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 6226,
			durationSec: 9.6,
			video: 'portfolio/websites/bakery-store.mp4',
			thumb: 'portfolio/websites/thumbs/bakery-store.jpg',
			liveUrl: null
		},
		{
			slug: 'biometic',
			title: 'BIOMETIC',
			fullTitle: 'BIOMETIC — Multi-Page Brand Platform',
			category: 'Next.js · Framer Motion',
			userSummary: 'A trusted science-backed product website built to educate visitors clearly, prove credibility with research sections, and convert curious readers into buyers.',
			bestFor: 'Health, supplement, biotech & wellness companies',
			userActions: 'Explore product science, compare benefits, read articles, visit brand store',
			usability: 'Distraction-free reading hierarchy on phones and large screens',
			siteFeatures: [
				'Complete multi-page brand site with Science, Story, Blog, and Careers sections',
				'Clear product explanation layout highlighting formula benefits and clinical proof',
				'Customer testimonials carousel and company mission breakdown',
				'Structured educational content that turns complex science into plain language',
				'Seamless navigation between research articles and product purchase pages',
				'Smooth scroll transitions and responsive desktop-to-mobile reading flow'
			],
			techSummary: 'Built with Next.js App Router, React, TypeScript, Framer Motion, Tailwind CSS, and Radix UI component primitives.',
			techFeatures: [
				'Multi-route Next.js App Router architecture (Home, Science, Blog, Careers & Store)',
				'Framer Motion viewport-driven reveal transitions across modular content sections',
				'Accessible Radix UI navigation menu, accordions, dialogs, and responsive drawer',
				'Reusable design system tokens with Tailwind CSS utilities and Lucide icon set'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Framer Motion', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 4909,
			durationSec: 7.6,
			video: 'portfolio/websites/biometic.mp4',
			thumb: 'portfolio/websites/thumbs/biometic.jpg',
			liveUrl: null
		},
		{
			slug: 'closet-studio',
			title: 'CLOSET STUDIO',
			fullTitle: 'CLOSET Studio — Editorial Commerce Build',
			category: 'Next.js 16 · Anime.js',
			userSummary: 'A visual fashion storefront where shoppers can explore seasonal lookbooks, filter collections quickly, and inspect garments before adding to bag.',
			bestFor: 'Apparel labels, boutique fashion & streetwear drops',
			userActions: 'Filter collections, preview full-color lookbooks, select garment sizes, checkout',
			usability: 'Fluid card motion and fast catalog filtering without reloads',
			siteFeatures: [
				'Interactive lookbook product cards that shift smoothly from grayscale to full color on hover',
				'Collection filtering, garment detail views, and slide-over shopping bag',
				'Size, fit, and fabric guidance arranged cleanly inside each garment view',
				'Full multi-page store covering Collections, About Us, Contact, and Checkout',
				'Dedicated drop highlight banners that draw focus to new arrivals',
				'Animated section reveals tailored for high-end fashion browsing on phone & desktop'
			],
			techSummary: 'Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Anime.js choreography, and Base UI primitives.',
			techFeatures: [
				'Anime.js timeline & scroll-driven product entrance choreography',
				'Client-side collection filtering, variant selection, and interactive bag drawer',
				'Server/Client component split with Next.js 16 App Router and React 19',
				'Custom CSS filter transitions with responsive image grid layout'
			],
			stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Anime.js', 'Base UI'],
			scrollHeight: 7389,
			durationSec: 11.3,
			video: 'portfolio/websites/closet-studio.mp4',
			thumb: 'portfolio/websites/thumbs/closet-studio.jpg',
			liveUrl: 'https://closet-e-commerce-store.vercel.app'
		},
		{
			slug: 'designer-brand',
			title: 'SERENE ATELIER',
			fullTitle: 'SERENE ATELIER — Catalog Web App',
			category: 'Next.js · Radix UI',
			userSummary: 'An organized digital showroom helping boutique customers browse limited pieces effortlessly while understanding brand heritage and sustainability.',
			bestFor: 'Independent designers, ateliers & curated boutiques',
			userActions: 'Browse seasonal catalog, inspect piece details, learn craft story, purchase directly',
			usability: 'Calm uncluttered spacing across desktop, tablet, and phone',
			siteFeatures: [
				'Clean online catalog displaying curated apparel cards with quick navigation',
				'Dedicated brand philosophy and sustainability information sections',
				'Sticky top menu and easy-to-browse mobile product layout',
				'Direct quick-view access so shoppers spend fewer clicks finding their piece',
				'Clear pricing, availability, and care details on catalog cards',
				'Streamlined product detail discovery with direct purchase CTAs'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, and Radix UI / shadcn-style accessible components.',
			techFeatures: [
				'Typed TypeScript catalog module powering reusable product card components',
				'Sticky responsive header navigation with mobile drawer & category routing',
				'Accessible Radix UI dialogs, tooltips, and interactive filter controls',
				'Utility-first responsive grid built with Tailwind CSS & tailwind-merge'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 3477,
			durationSec: 7.1,
			video: 'portfolio/websites/designer-brand.mp4',
			thumb: 'portfolio/websites/thumbs/designer-brand.jpg',
			liveUrl: null
		},
		{
			slug: 'evasion-e-commerce',
			title: 'EVASION',
			fullTitle: 'EVASION — Section-Modular Commerce',
			category: 'Next.js · TypeScript',
			userSummary: 'A high-impact outdoor & gear storefront combining immersive campaign visuals, transparent material performance specs, and smooth direct shopping.',
			bestFor: 'Outdoor gear, performance apparel & lifestyle brands',
			userActions: 'Compare gear specs, switch collections, read customer reviews, shop directly',
			usability: 'Crisp high-contrast layout readable in bright or dark settings',
			siteFeatures: [
				'Full-screen campaign hero backed by featured gear cards and lookbook gallery',
				'Interactive technology showcase explaining fabric & gear performance specs',
				'Category collections strip, field journal section, and customer review blocks',
				'Direct side-by-side product highlights making technical differences simple to grasp',
				'Trust and warranty callouts placed right near shopping actions',
				'Responsive shopping navigation optimized for deep multi-section scrolling'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, and modular Radix UI interface components.',
			techFeatures: [
				'10-section modular App Router landing architecture with strict component isolation',
				'Interactive product gallery, technology spec tabs, and collection showcase sliders',
				'Responsive image optimization with hardware-accelerated hover transitions',
				'Accessible Radix UI primitive integration across navigation and modals'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 18639,
			durationSec: 11.6,
			video: 'portfolio/websites/evasion-e-commerce.mp4',
			thumb: 'portfolio/websites/thumbs/evasion-e-commerce.jpg',
			liveUrl: null
		},
		{
			slug: 'fitness-platform',
			title: 'SOBERS',
			fullTitle: 'SOBERS — GSAP Motion Landing App',
			category: 'Next.js 16 · GSAP',
			userSummary: 'An energetic training and membership website designed to guide visitors clearly through coaching plans and encourage fast sign-ups.',
			bestFor: 'Gyms, fitness coaches, wellness clubs & training programs',
			userActions: 'Explore training tracks, compare memberships, sign up for sessions',
			usability: 'Smooth guided scrolling built for quick mobile sign-ups',
			siteFeatures: [
				'Motion-driven landing experience that unfolds training highlights as visitors scroll',
				'Clear program overview, membership flow, and high-visibility sign-up CTAs',
				'Easy-to-scan schedule and coaching benefit breakdowns for new visitors',
				'Smooth interactive card reveals without distracting visual clutter',
				'Instant join buttons positioned consistently for quick mobile conversion',
				'Responsive layout built for fast viewing on both mobile and desktop'
			],
			techSummary: 'Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and GSAP timeline animation engine.',
			techFeatures: [
				'GSAP scroll-triggered timelines and scrubbed hero element orchestration',
				'GPU-composited transforms and opacity choreography for 60fps scroll performance',
				'Tailwind CSS v4 custom theme variables paired with Base UI controls',
				'Modular Next.js App Router layout tuned for responsive desktop & mobile views'
			],
			stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'GSAP', 'Base UI'],
			scrollHeight: 7810,
			durationSec: 11.6,
			video: 'portfolio/websites/fitness-platform.mp4',
			thumb: 'portfolio/websites/thumbs/fitness-platform.jpg',
			liveUrl: 'https://fitness-app-gamma-three.vercel.app'
		},
		{
			slug: 'fork-of-cake-shop',
			title: 'SWEET CAKES',
			fullTitle: 'SWEET CAKES — Configurator Commerce App',
			category: 'Next.js · Radix UI',
			userSummary: 'A playful interactive gift & dessert shop where customers assemble their own assortment box, verify flavors, and submit custom event requests.',
			bestFor: 'Specialty food boxes, bakeries & custom gifting brands',
			userActions: 'Mix items into custom boxes, choose flavors, quick-add cards, send inquiries',
			usability: 'One-tap Quick Add and simple step-by-step box creation',
			siteFeatures: [
				'Interactive Custom Cake Box Builder where visitors mix items into their own box',
				'Interactive Flavor Picker and One-Click Quick Add buttons on every card',
				'Animated milestone counters showcasing order volume & kitchen highlights',
				'Built-in inquiry form for custom event orders, weddings, and bulk gifting',
				'Clear delivery scheduling and packaging highlights before checkout',
				'Mobile-ready category shortcuts for fast impulse browsing'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, interactive state builders, and Radix UI.',
			techFeatures: [
				'Custom interactive Box Builder & flavor-selection state engine',
				'Viewport-triggered CountUp number interpolation and ScrollReveal observer hooks',
				'Quick-Add cart synchronization across category filter cards',
				'Validated multi-field order inquiry form with accessible Radix UI controls'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 6991,
			durationSec: 10.7,
			video: 'portfolio/websites/fork-of-cake-shop.mp4',
			thumb: 'portfolio/websites/thumbs/fork-of-cake-shop.jpg',
			liveUrl: null
		},
		{
			slug: 'homie',
			title: 'HOMIE',
			fullTitle: 'HOMIE — Platform Web Application',
			category: 'Next.js 16 · Framer Motion',
			userSummary: 'A clear two-sided home platform website that answers questions fast, compares pricing transparently, and connects property owners and renters.',
			bestFor: 'PropTech platforms, rental marketplaces & SaaS services',
			userActions: 'Switch owner/renter views, compare transparent plans, expand FAQs, book demo',
			usability: 'Instant clarity with clean pricing cards and keyboard-ready FAQs',
			siteFeatures: [
				'Side-by-side platform breakdown for homeowners and renters',
				'Animated live statistics counters, transparent pricing plans & interactive FAQ dropdowns',
				'Customer testimonials slider and smooth motion reveals across every band',
				'Step-by-step "How It Works" visual flow eliminating confusion for first-time users',
				'Clear lead-capture & booking buttons across hero and footer sections',
				'Mobile-optimized comparison tables that remain readable on narrow screens'
			],
			techSummary: 'Built with Next.js 16, React, TypeScript, Tailwind CSS 4, Framer Motion, and Radix UI.',
			techFeatures: [
				'Framer Motion scroll-triggered staggered entrances & interactive spring states',
				'Real-time animated statistics counters and interactive pricing comparison toggles',
				'Radix UI accordion FAQ module with keyboard & screen-reader support',
				'Responsive multi-column marketplace sections with zero layout shift'
			],
			stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS 4', 'Framer Motion', 'Radix UI'],
			scrollHeight: 7797,
			durationSec: 11.6,
			video: 'portfolio/websites/homie.mp4',
			thumb: 'portfolio/websites/thumbs/homie.jpg',
			liveUrl: 'https://homie-eight-gamma.vercel.app'
		},
		{
			slug: 'hously-architecture',
			title: 'HOUSLY',
			fullTitle: 'HOUSLY — Architecture Studio Platform',
			category: 'Next.js 16 · Radix UI',
			userSummary: 'A confident architectural portfolio built to impress prospective homeowners and commercial clients, walk through past builds, and book consultations.',
			bestFor: 'Architecture firms, interior studios & luxury builders',
			userActions: 'Browse completed homes, review expertise tabs, expand FAQs, request consultation',
			usability: 'Large clean imagery paired with direct client inquiry paths',
			siteFeatures: [
				'Full-width visual hero paired with studio philosophy & architectural expertise tabs',
				'Curated portfolio project showcase displaying completed architectural builds',
				'Clear project process breakdown showing stages from concept to handover',
				'Expandable client FAQ section answering project timelines and consultation steps',
				'Direct inquiry call-to-action designed for high-value studio leads',
				'Crisp gallery presentation tailored for both large monitors and client tablets'
			],
			techSummary: 'Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and shadcn/Radix UI primitives.',
			techFeatures: [
				'Layered foreground/background parallax hero built with semantic layout containers',
				'Modular project showcase grid with dynamic filtering and smooth transitions',
				'Accessible Radix UI FAQ accordion and responsive header drawer',
				'Strict TypeScript component library styled via Tailwind CSS v4 tokens'
			],
			stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Radix UI', 'shadcn/ui'],
			scrollHeight: 6382,
			durationSec: 9.8,
			video: 'portfolio/websites/hously-architecture.mp4',
			thumb: 'portfolio/websites/thumbs/hously-architecture.jpg',
			liveUrl: 'https://hously-modern-architecture.vercel.app'
		},
		{
			slug: 'katachi',
			title: 'KATACHI',
			fullTitle: 'KATACHI — Motion Storefront',
			category: 'Next.js · Framer Motion',
			userSummary: 'A refined furniture and home objects showcase highlighting tactile wood, stone, and fabric finishes while making collection discovery effortless.',
			bestFor: 'Furniture studios, home decor & industrial design brands',
			userActions: 'Swipe horizontal collections, inspect material swatches, join updates list',
			usability: 'Smooth touch-ready horizontal browsing and clean gallery pacing',
			siteFeatures: [
				'Featured furniture gallery paired with an interactive horizontal collection strip',
				'Dedicated Materials Showcase explaining wood, fabric, and stone finishes',
				'Clear dimensions and living-space inspiration right beside key pieces',
				'Smooth hover transitions and clean full-screen visual presentation',
				'Built-in newsletter opt-in bar and multi-device storefront layout',
				'Swipe-friendly collection rails ideal for browsing from phones or tablets'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Framer Motion, Tailwind CSS, and Radix UI.',
			techFeatures: [
				'Framer Motion layout transitions across horizontal strips and featured grids',
				'Interactive material & collection switchers driven by TypeScript datasets',
				'Responsive viewport scaling for high-resolution product media',
				'Accessible Radix UI navigation, modal overlays, and form validation'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Framer Motion', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 5743,
			durationSec: 8.9,
			video: 'portfolio/websites/katachi.mp4',
			thumb: 'portfolio/websites/thumbs/katachi.jpg',
			liveUrl: null
		},
		{
			slug: 'luxury-jewellery',
			title: 'AURELIA',
			fullTitle: 'AURELIA — High-Resolution Storefront',
			category: 'Next.js · TypeScript',
			userSummary: 'A high-trust fine jewelry storefront engineered to showcase craftsmanship, build buyer confidence with certification details, and simplify concierge inquiries.',
			bestFor: 'Fine jewelry, watchmaking & bespoke luxury houses',
			userActions: 'Explore curated jewelry tiers, verify certifications, contact concierge, join clientelist',
			usability: 'High-clarity product display paired with reassuring trust badges',
			siteFeatures: [
				'Multi-collection showroom browsing across Fine Jewelry, High Jewelry, and Bespoke lines',
				'Dedicated trust highlights (insured courier, craftsmanship proof, certified gems)',
				'Individual product detail cards with clear pricing and concierge links',
				'Direct private appointment and bespoke request entry points',
				'Clean stone, karat, and care summaries for confident online purchasing',
				'Private clientelist newsletter form and responsive mobile showcase'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, and Radix UI component architecture.',
			techFeatures: [
				'Typed multi-collection product catalog with helper lookup queries (`getProduct`)',
				'Interactive newsletter capture form with state-driven feedback & validation',
				'Reusable ProductCard & Collection components across dynamic routes',
				'Responsive Tailwind CSS grid with subtle border & hover elevation states'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 6444,
			durationSec: 9.9,
			video: 'portfolio/websites/luxury-jewellery.mp4',
			thumb: 'portfolio/websites/thumbs/luxury-jewellery.jpg',
			liveUrl: null
		},
		{
			slug: 'modern-pet-store',
			title: 'PETDO',
			fullTitle: 'PETDO — Context-Driven E-Commerce',
			category: 'Next.js · Context API',
			userSummary: 'A friendly online pet store that makes finding food, beds, toys, and grooming essentials simple for pet parents with instant cart updates.',
			bestFor: 'Pet care retailers, vet shops & everyday subscription goods',
			userActions: 'Filter by Food/Beds/Toys/Grooming, add to cart cleanly, track basket total',
			usability: 'Clear category tabs and instant toast feedback on every click',
			siteFeatures: [
				'Category filters for Food, Beds, Toys, and Grooming with live shopping cart count',
				'Instant toast notifications when shoppers add items to their cart',
				'Trust badges for fast delivery and 100% satisfaction guarantee',
				'Clear sizing and pet-type callouts so buyers pick the right fit first time',
				'Fast one-click repeat purchase navigation across everyday essentials',
				'Mobile-friendly store layout with resilient product image handling'
			],
			techSummary: 'Built with Next.js, React, TypeScript, React Context state provider, Tailwind CSS, and Radix UI.',
			techFeatures: [
				'Global `useStore` React Context provider for live cart, badge counts & filters',
				'Resilient `SafeImage` fallback component preventing broken external media states',
				'Category tabs & search-friendly grid wired with Sonner toast notifications',
				'Accessible Radix UI dialogs, inputs, and mobile drawer controls'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'React Context', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 4004,
			durationSec: 7.1,
			video: 'portfolio/websites/modern-pet-store.mp4',
			thumb: 'portfolio/websites/thumbs/modern-pet-store.jpg',
			liveUrl: null
		},
		{
			slug: 'mono-e-commerce',
			title: 'MONO',
			fullTitle: 'MONO — Monochrome Storefront System',
			category: 'Next.js · Radix UI',
			userSummary: 'A structured multi-page gear storefront that balances bold imagery with deep product spec accordions, reviews, and friction-free navigation.',
			bestFor: 'Tech accessories, carry gear & minimalist hardware brands',
			userActions: 'Inspect technical spec accordions, switch gear categories, read reviews',
			usability: 'Persistent top menu keeping every category one tap away',
			siteFeatures: [
				'High-contrast product showcase featuring technical gear specs and galleries',
				'Multi-page site with Home, Featured Gear, Journal, and Contact pages',
				'Interactive technology breakdown, testimonials, and sticky navigation header',
				'Expandable spec & warranty questions keeping product pages uncluttered',
				'Dedicated comparison sections clarifying everyday use vs pro models',
				'Clean mobile and desktop storefront reading flow'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, and modular Radix UI primitives.',
			techFeatures: [
				'High-contrast design system structured across 10 independent section modules',
				'Multi-page App Router navigation (Home, Collections, Contact & Product views)',
				'Interactive accordion specs, sliders, and persistent header navigation',
				'Responsive CSS grid system optimized for mobile and widescreen displays'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 17804,
			durationSec: 11.6,
			video: 'portfolio/websites/mono-e-commerce.mp4',
			thumb: 'portfolio/websites/thumbs/mono-e-commerce.jpg',
			liveUrl: 'https://mono-e-commerce.vercel.app'
		},
		{
			slug: 'olea',
			title: 'OLEA',
			fullTitle: 'OLEA — Modular Commerce Platform',
			category: 'Next.js · TypeScript',
			userSummary: 'A warm botanical skincare store designed for quick buyer trust—pairing bestseller star ratings, clean safety badges, and effortless navigation.',
			bestFor: 'Organic beauty, botanical skincare & apothecary brands',
			userActions: 'Browse bestsellers, check star ratings & safety promises, subscribe for drops',
			usability: 'Scannable benefit cards and fast mobile loading',
			siteFeatures: [
				'Bestselling skincare product cards with clear benefit highlights and star ratings',
				'Purity & botanical safety guarantee strip (clean formula, fast dispatch)',
				'Routine guidance snippets explaining how and when to use each formula',
				'Newsletter subscription box and smooth navigation between shop & story sections',
				'Direct add-to-bag actions right from curated bestseller cards',
				'Clean mobile-responsive browsing experience'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, and Radix UI component primitives.',
			techFeatures: [
				'Structured TypeScript product data driving reusable `ProductCard` grids',
				'Client-side React hook interactions (`useState`/`useEffect`) for dynamic UI state',
				'Validated newsletter subscription module paired with custom Icon/Badge system',
				'Responsive multi-column storefront layout with Radix UI accessibility'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 5892,
			durationSec: 9.1,
			video: 'portfolio/websites/olea.mp4',
			thumb: 'portfolio/websites/thumbs/olea.jpg',
			liveUrl: null
		},
		{
			slug: 'pixelforge',
			title: 'PIXELFORGE',
			fullTitle: 'PIXELFORGE — Scroll-Expansion Media App',
			category: 'Next.js 16 · Framer Motion',
			userSummary: 'An interactive agency showcase where full-screen reel previews expand as visitors scroll—helping prospective clients judge production quality immediately.',
			bestFor: 'Production houses, creative agencies & directors',
			userActions: 'Scroll-expand hero reel, explore production services, request a quote',
			usability: 'Cinema-smooth video playback and effortless inquiry routing',
			siteFeatures: [
				'Interactive video hero that smoothly expands to full screen as you scroll down',
				'Service showcase cards for Video Production, Photography, Direction & Post',
				'Glowing gradient highlight cards with staggered reveal animations',
				'Clear deliverable scope sections showing clients what each package covers',
				'Fast portfolio-to-contact routing for producers ready to book a shoot',
				'Multi-page agency navigation across desktop and phone screens'
			],
			techSummary: 'Built with Next.js 16, React, TypeScript, Tailwind CSS 4, and Framer Motion.',
			techFeatures: [
				'Custom `ScrollExpandMedia` hero scaling inline video card to full viewport on scroll',
				'Reusable `SectionReveal` and `StaggerChildren` Framer Motion wrappers',
				'Cursor/gradient highlight `GradientCard` surfaces built with Tailwind CSS 4',
				'Configured `next/image` pipeline supporting external video & high-res assets'
			],
			stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS 4', 'Framer Motion'],
			scrollHeight: 5250,
			durationSec: 8.1,
			video: 'portfolio/websites/pixelforge.mp4',
			thumb: 'portfolio/websites/thumbs/pixelforge.jpg',
			liveUrl: 'https://video-expansion.vercel.app'
		},
		{
			slug: 'premium-luxury-store',
			title: 'MAISON',
			fullTitle: 'MAISON — Lenis Smooth-Scroll Commerce',
			category: 'Next.js · Lenis + Motion',
			userSummary: 'An unhurried digital flagship crafted with silk-smooth scroll physics so luxury shoppers experience craft stories alongside collection browsing.',
			bestFor: 'Heritage fashion houses, bespoke accessories & luxury retail',
			userActions: 'Experience smooth heritage chapters, zoom pieces on hover, shop capsules',
			usability: 'Silk-smooth scroll feel without jank across monitors and tablets',
			siteFeatures: [
				'Ultra-smooth silk scrolling paired with editorial fashion collection grids',
				'Dedicated Brand Heritage chapter highlighting craftsmanship and materials',
				'Subtle hover zoom effects across luxury product previews',
				'Clean seasonal lookbook flow balancing storytelling with direct piece links',
				'Minimal navigation focusing attention entirely on product craftsmanship',
				'Responsive layout tailored for calm desktop & mobile browsing'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Lenis smooth scroll, Framer Motion, Tailwind CSS, and Radix UI.',
			techFeatures: [
				'Lenis smooth-scroll physics synchronized with Framer Motion section reveals',
				'Modular `CollectionGrid` and heritage timeline UI components',
				'Responsive viewport scaling with GPU-composited image zoom effects',
				'Accessible Radix UI navigation & overlay primitive system'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Lenis', 'Framer Motion', 'Tailwind CSS'],
			scrollHeight: 4144,
			durationSec: 7.1,
			video: 'portfolio/websites/premium-luxury-store.mp4',
			thumb: 'portfolio/websites/thumbs/premium-luxury-store.jpg',
			liveUrl: null
		},
		{
			slug: 'thudarum-luxury-fashion',
			title: 'THUDARUM',
			fullTitle: 'THUDARUM — Fashion Storefront App',
			category: 'Next.js · TypeScript',
			userSummary: 'A streamlined contemporary fashion storefront featuring live promo/coupon savings inside the bag so shoppers check out confidently.',
			bestFor: 'Modern clothing labels, D2C drops & promo-driven stores',
			userActions: 'Browse fashion grid, open cart drawer, apply live promo codes, checkout',
			usability: 'Instant discount calculation and zero-clutter checkout summary',
			siteFeatures: [
				'Clean contemporary apparel grid with quick item browsing and cart drawer',
				'Working promo & coupon code checker that calculates order discounts live',
				'Real-time bag subtotal, discount breakdown, and order summary preview',
				'Streamlined navigation bar and minimal checkout summary',
				'Quick size and color clarity before adding items to bag',
				'Responsive sizing and layout across phones, tablets, and desktops'
			],
			techSummary: 'Built with Next.js, React, TypeScript, Tailwind CSS, and Radix UI / Recharts UI primitives.',
			techFeatures: [
				'Client-side promo/coupon discount validation logic inside checkout flow',
				'Modular `ProductGrid` & shopping cart drawer state synchronized across routes',
				'Accessible Radix UI form inputs, dialogs, tooltips, and tabs',
				'Responsive grid system built with Tailwind CSS utility tokens'
			],
			stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
			scrollHeight: 2283,
			durationSec: 7.1,
			video: 'portfolio/websites/thudarum-luxury-fashion.mp4',
			thumb: 'portfolio/websites/thumbs/thudarum-luxury-fashion.jpg',
			liveUrl: null
		},
		{
			slug: 'webrenew',
			title: 'WEBRENEW',
			fullTitle: 'WEBRENEW — Agency Web Platform',
			category: 'Next.js 16 · Motion + Lenis',
			userSummary: 'A high-conversion B2B digital agency platform where founders can switch interactively across Web, Mobile, AI, and Automation capabilities and book a call.',
			bestFor: 'B2B software studios, AI consultancies & SaaS agencies',
			userActions: 'Switch service tabs, explore technical scope, review values, book call',
			usability: 'Snappy interactive tabs and zero-friction consultation flows',
			siteFeatures: [
				'Interactive service tabs switching between Web Apps, Mobile, AI & Automation',
				'Cursor-responsive luminous highlight cards for agency capabilities',
				'Transparent engagement process showing project timeline & collaboration flow',
				'Butter-smooth scrolling experience with partnership values breakdown',
				'Clear consultation booking and project inquiry flows',
				'Responsive desktop-to-mobile structure built for busy decision makers'
			],
			techSummary: 'Built with Next.js 16, React, TypeScript, Tailwind CSS 4, Lenis, and Motion.',
			techFeatures: [
				'Interactive capability `Tabs` system switching dynamically across service pillars',
				'Pointer-tracked `GlowingEffect` border shader cards powered by Motion',
				'Lenis smooth-scrolling runtime integrated with App Router pages',
				'Full Radix UI primitive suite & modular responsive layout sections'
			],
			stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS 4', 'Lenis', 'Motion'],
			scrollHeight: 3024,
			durationSec: 7.1,
			video: 'portfolio/websites/webrenew.mp4',
			thumb: 'portfolio/websites/thumbs/webrenew.jpg',
			liveUrl: 'https://agency-website-one-teal.vercel.app'
		}
	];

	// Smooth adaptive playback rate so middle scroll sections remain readable
	var WEBSITE_EDGE_RATE = 0.55;
	window.getWebsitePlaybackRate = function (video, baseEdgeRate) {
		var edge = typeof baseEdgeRate === 'number' ? baseEdgeRate : WEBSITE_EDGE_RATE;
		var dur = video && video.duration;
		if (!dur || !isFinite(dur) || dur <= 0) return edge;
		var p = video.currentTime / dur;
		if (p <= 0.07 || p >= 0.91) return edge;
		var u = (p - 0.07) / 0.84;
		var minMidRate = Math.min(edge, dur >= 10.5 ? 0.18 : 0.24);
		return Number((edge - (edge - minMidRate) * Math.sin(Math.PI * u)).toFixed(3));
	};

	window.bindWebsiteSpeed = function (video, modeGetter) {
		if (!video || video.dataset.speedBound) return;
		video.dataset.speedBound = '1';
		function apply() {
			var mode = typeof modeGetter === 'function' ? modeGetter() : 'adaptive';
			var rate;
			if (mode === 'fixed-slow') rate = 0.28;
			else if (mode === 'fixed-normal') rate = 1.0;
			else rate = window.getWebsitePlaybackRate(video, WEBSITE_EDGE_RATE);
			video.defaultPlaybackRate = rate;
			if (Math.abs(video.playbackRate - rate) > 0.015) {
				video.playbackRate = rate;
			}
		}
		video.__applyWebsiteSpeed = apply;
		apply();
		video.addEventListener('loadedmetadata', apply);
		video.addEventListener('play', apply);
		video.addEventListener('timeupdate', apply);
	};
})();
