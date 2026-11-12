(function () {
	'use strict';

	window.REVOLVYN_WEBSITES = [
		{
			slug: 'amber-skincare',
			title: 'AMBER',
			fullTitle: 'AMBER — E-Commerce Storefront',
			category: 'Next.js · Shopify Storefront',
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
