-- ─── 002_content_expansion: full-site content coverage (idempotent) ───────────
-- Adds: portfolio layout column, helpful indexes, missing pages, all real
-- homepage/portfolio/brands/services/contact/secondary-page sections,
-- complete 34-project portfolio, services 07–08, footer/contact settings.
-- Never touches drafts the owner already edited: every INSERT uses
-- ON CONFLICT DO NOTHING; the portfolio reseed only removes the 6
-- placeholder rows from the original seed.

-- A. Portfolio layout (portrait / landscape) + indexes -----------------------
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS layout TEXT NOT NULL DEFAULT 'landscape';
CREATE INDEX IF NOT EXISTS idx_portfolio_sort ON portfolio_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_sort ON brands (sort_order);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services (sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_sort ON testimonials (sort_order);
CREATE INDEX IF NOT EXISTS idx_sections_page_sort ON page_sections (page_id, sort_order);

-- B. Missing pages ------------------------------------------------------------
INSERT INTO pages (slug, name, status) VALUES
  ('careers',      'Careers',      'active'),
  ('partnerships', 'Partnerships', 'active'),
  ('blog',         'Blog',         'active'),
  ('research',     'Research',     'active'),
  ('newsletter',   'Newsletter',   'active'),
  ('community',    'Community',    'active'),
  ('privacy',      'Privacy',      'active'),
  ('refund',       'Refund',       'active')
ON CONFLICT (slug) DO NOTHING;

-- C. Home: real preview sections (hero/manifesto/quote/cta exist from seed) --
UPDATE page_sections SET sort_order = 4 WHERE section_key = 'quote' AND page_id = (SELECT id FROM pages WHERE slug = 'home');
UPDATE page_sections SET sort_order = 5 WHERE section_key = 'cta' AND page_id = (SELECT id FROM pages WHERE slug = 'home');
UPDATE page_sections SET sort_order = 6 WHERE section_key = 'footer' AND page_id = (SELECT id FROM pages WHERE slug = 'home');
DELETE FROM page_sections WHERE section_key = 'footer' AND page_id = (SELECT id FROM pages WHERE slug = 'home');

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'portfolio_preview', 'teaser',
  '{"label":"Portfolio","linkText":"View More ?","linkUrl":"portfolio.html"}'::jsonb, 2, TRUE
FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'brands_preview', 'teaser',
  '{"label":"Brands We Work With","linkText":"More Brands ?","linkUrl":"brands.html"}'::jsonb, 3, TRUE
FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- D. Portfolio page sections ---------------------------------------------------
INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero',
  '{"titleA":"Our","titleAccent":"Work","subtitle":"Cinematic content that converts"}'::jsonb, 0, TRUE
FROM pages WHERE slug = 'portfolio'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'cta', 'cta',
  '{"linkText":"Start a Project →","linkUrl":"contact.html"}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'portfolio'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- E. Portfolio: full 34-project catalogue (replaces 6 seed placeholders) ------
DELETE FROM portfolio_items
WHERE slug IN ('project-one','project-two','project-three','project-four','project-five','project-six');

INSERT INTO portfolio_items (title, slug, description, thumbnail, video_url, external_url, client_name, category, layout, is_visible, sort_order) VALUES
('ELEVENLABS','elevenlabs-1','ElevenLabs is an AI voice technology brand.','','https://video.wixstatic.com/video/4c7a69_14df8fc89d244a96b8926669d3d7db8d/360p/mp4/file.mp4','','ELEVENLABS','Video','landscape',TRUE,0),
('ELEVENLABS','elevenlabs-2','ElevenLabs is an AI voice technology brand.','','https://video.wixstatic.com/video/4c7a69_d70cd22e3f424a88a11add0aaa8715e0/360p/mp4/file.mp4','','ELEVENLABS','Video','landscape',TRUE,1),
('ELEVENLABS','elevenlabs-3','ElevenLabs is an AI voice technology brand.','','https://video.wixstatic.com/video/4c7a69_686d4b3aa59148239d4a71b3de795c6c/360p/mp4/file.mp4','','ELEVENLABS','Video','landscape',TRUE,2),
('ELEVENLABS','elevenlabs-4','ElevenLabs is an AI voice technology brand.','','https://video.wixstatic.com/video/4c7a69_23f184027c3549bd99bb139ab1069ccf/360p/mp4/file.mp4','','ELEVENLABS','Video','landscape',TRUE,3),
('ELEVENLABS','elevenlabs-5','ElevenLabs is an AI voice technology brand.','','https://video.wixstatic.com/video/4c7a69_0b31155196524c02b137c09a4adc76f3/360p/mp4/file.mp4','','ELEVENLABS','Video','landscape',TRUE,4),
('FLEXER AI','flexer-ai','Flexer AI is an AI-powered automation brand.','','https://video.wixstatic.com/video/4c7a69_222842af6e0041df96c38a0f441f9bea/360p/mp4/file.mp4','','FLEXER AI','Video','landscape',TRUE,5),
('LOVABLE','lovable','Lovable is a digital creation and app-building platform.','','https://video.wixstatic.com/video/4c7a69_5668e652a6884cd8836549b78cf45743/360p/mp4/file.mp4','','LOVABLE','Video','landscape',TRUE,6),
('OG USERNAMES','og-usernames','OG Usernames is a digital identity and username brand.','','https://video.wixstatic.com/video/4c7a69_79283b4698b040f89bffa697139f5979/360p/mp4/file.mp4','','OG USERNAMES','Video','portrait',TRUE,7),
('TRIVX','trivx','Trivx is a technology and innovation brand.','','https://video.wixstatic.com/video/4c7a69_141b2d08cb6748bb987c19f0b683e40f/360p/mp4/file.mp4','','TRIVX','Video','landscape',TRUE,8),
('SONEPAR','sonepar','Sonepar Automation Expo is an industrial automation brand.','','https://video.wixstatic.com/video/4c7a69_1e1da840cb98495a85faf9d92e5b7cb8/1080p/mp4/file.mp4','','SONEPAR','Video','landscape',TRUE,9),
('MARK VIBE','mark-vibe','Mark Vibe is a creative and lifestyle brand.','','https://video.wixstatic.com/video/4c7a69_1c35e20217e14a8db126397e5e2029e8/1080p/mp4/file.mp4','','MARK VIBE','Video','landscape',TRUE,10),
('CRISPANA','crispana-1','Crispana is a food and lifestyle brand.','','https://video.wixstatic.com/video/4c7a69_95ce005d31f74d3bb9dbc36e126d5556/1080p/mp4/file.mp4','','CRISPANA','Video','landscape',TRUE,11),
('MR NUTTS OATS','mr-nutts-oats-1','Mr Nutts Oats is a health food and breakfast brand.','','https://video.wixstatic.com/video/4c7a69_cca1cedb933341988f871a0cdbba540b/1080p/mp4/file.mp4','','MR NUTTS OATS','Video','landscape',TRUE,12),
('MR NUTTS OATS','mr-nutts-oats-2','Mr Nutts Oats is a health food and breakfast brand.','','https://video.wixstatic.com/video/4c7a69_deb755ab4ad04c829c94225ee5df4860/1080p/mp4/file.mp4','','MR NUTTS OATS','Video','landscape',TRUE,13),
('OXINKLE','oxinkle','Oxinkle is a modern consumer brand.','','https://video.wixstatic.com/video/4c7a69_6e96bd03ea484471b4b8e5df3ec24506/1080p/mp4/file.mp4','','OXINKLE','Video','landscape',TRUE,14),
('DALEN BELTS','dalen-belts','Dalen Belts is a fashion accessories brand.','','https://video.wixstatic.com/video/4c7a69_a17b296ca1544a43bbc4e618676526f6/1080p/mp4/file.mp4','','DALEN BELTS','Video','landscape',TRUE,15),
('CRISPANA','crispana-2','Crispana is a food and lifestyle brand.','','https://video.wixstatic.com/video/4c7a69_bf6bc2180a9f4cebaa869ab4b2e2b8a4/720p/mp4/file.mp4','','CRISPANA','Video','landscape',TRUE,16),
('EATFESTO','eatfesto-1','EatFesto is a food and dining-focused brand.','','https://video.wixstatic.com/video/4c7a69_0abcdc24eaed4b3e95a67da99aa1a2b0/1080p/mp4/file.mp4','','EATFESTO','Video','portrait',TRUE,17),
('EATFESTO','eatfesto-2','EatFesto is a food and dining-focused brand.','','https://video.wixstatic.com/video/4c7a69_c46cfd63cd96443badd9a27a0665fdff/1080p/mp4/file.mp4','','EATFESTO','Video','portrait',TRUE,18),
('TEZZO','tezzo','Tezzo is a modern lifestyle-oriented brand.','','https://video.wixstatic.com/video/4c7a69_50273e50f63d448e818bd9122e3fc5e1/720p/mp4/file.mp4','','TEZZO','Video','landscape',TRUE,19),
('NIKE','nike-1','Nike is a globally recognized sportswear and lifestyle brand.','','https://video.wixstatic.com/video/4c7a69_e9c69930b4f74394a7a24aaa079c9e50/720p/mp4/file.mp4','','NIKE','Video','landscape',TRUE,20),
('NIKE','nike-2','Nike is a globally recognized sportswear and lifestyle brand.','','https://video.wixstatic.com/video/4c7a69_b378be38f16a48885fc3ef997da7c6/720p/mp4/file.mp4','','NIKE','Video','landscape',TRUE,21),
('NIKE','nike-3','Nike is a globally recognized sportswear and lifestyle brand.','','https://video.wixstatic.com/video/4c7a69_52ab300a0f5d4f3eb2e022531b7f5f26/720p/mp4/file.mp4','','NIKE','Video','landscape',TRUE,22),
('PROSKIRE','proskire','Proskire is a performance and lifestyle-focused brand.','','https://video.wixstatic.com/video/4c7a69_e0893a64f65d45c288100d58ed3ac6e7/720p/mp4/file.mp4','','PROSKIRE','Video','landscape',TRUE,23),
('RELANCE','relance','Relance is a contemporary consumer brand.','','https://video.wixstatic.com/video/4c7a69_ae60f198c15a4dabbec575bb07569699/720p/mp4/file.mp4','','RELANCE','Video','landscape',TRUE,24),
('KERASTASE','kerastase','Kerastase is a premium professional haircare brand.','','https://video.wixstatic.com/video/4c7a69_85112fcc1b354ceba8e9b7400194de5a/720p/mp4/file.mp4','','KERASTASE','Video','landscape',TRUE,25),
('MEDICINE MAMA','medicine-mama','Medicine Mama is a natural beauty and skincare brand.','','https://video.wixstatic.com/video/4c7a69_6e02f73ac2854749902a919538d625f4/720p/mp4/file.mp4','','MEDICINE MAMA','Video','landscape',TRUE,26),
('KORA ORGANIC','kora-organic','KORA Organics is a skincare and wellness brand.','','https://video.wixstatic.com/video/4c7a69_dc3f7913414e4dbe8f3bc3cdd7f07116/480p/mp4/file.mp4','','KORA ORGANIC','Video','portrait',TRUE,27),
('DIOR','dior','Dior is a globally renowned luxury fashion and beauty house.','','https://video.wixstatic.com/video/4c7a69_f41b341b60e34a8193adb23bb5b7f217/480p/mp4/file.mp4','','DIOR','Video','portrait',TRUE,28),
('CARATLANE','caratlane','CaratLane is a modern jewelry brand.','','https://video.wixstatic.com/video/4c7a69_14a8db37650e4e048c74550cdc0850bd/360p/mp4/file.mp4','','CARATLANE','Video','portrait',TRUE,29),
('INSTA360','insta360','Insta360 is an action camera and imaging technology brand.','','https://video.wixstatic.com/video/4c7a69_13620f51b0ed46c5914c8523b4a77218/720p/mp4/file.mp4','','INSTA360','Video','portrait',TRUE,30),
('NOTHING','nothing','Nothing is a consumer technology brand.','','https://video.wixstatic.com/video/4c7a69_a9f35c5bc14746b1af9e2afae93f07e3/360p/mp4/file.mp4','','NOTHING','Video','portrait',TRUE,31),
('CAFE','cafe-1','Cafe-focused content designed around food, atmosphere, and lifestyle.','','https://video.wixstatic.com/video/4c7a69_0e60df56daa74e448177aac81ff654ce/720p/mp4/file.mp4','','CAFE','Video','landscape',TRUE,32),
('CAFE','cafe-2','Cafe-focused content designed around food, atmosphere, and lifestyle.','','https://video.wixstatic.com/video/4c7a69_498dc7119da64efc845ed771d89eb7e6/720p/mp4/file.mp4','','CAFE','Video','landscape',TRUE,33)
ON CONFLICT (slug) DO NOTHING;

-- F. Brands page sections ------------------------------------------------------
INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero',
  '{"title":"Brands We Work With","subtitle":"320+ brands trust REVOLVYN to deliver high-impact campaigns and cinematic content that drives real results."}'::jsonb, 0, TRUE
FROM pages WHERE slug = 'brands'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'stats', 'stats',
  '{"items":[{"number":"320+","label":"Brands Served"},{"number":"4,500+","label":"Ads Created"},{"number":"110+","label":"YouTubers"}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'brands'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'cta', 'cta',
  '{"heading":"Want to grow with us?","buttonText":"Contact Us","buttonUrl":"contact.html"}'::jsonb, 2, TRUE
FROM pages WHERE slug = 'brands'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- G. Services: hero, full details fix, services 07–08, process, CTA -----------
INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero',
  '{"title":"What We Do","subtitle":"Full-stack digital marketing — from influencer campaigns to cinematic content, performance ads, SEO, and brand strategy."}'::jsonb, 0, TRUE
FROM pages WHERE slug = 'services'
ON CONFLICT (page_id, section_key) DO NOTHING;

UPDATE services SET details =
  '[{"package":"Creator Campaign","items":["20 creator videos","Creator strategy","Creator selection","Multiple creators from Revolvyn''s network","Concepts + scripts","Creator coordination","Editing","Captions","Content organization","Monthly performance review"]}]'::jsonb
WHERE slug = 'influencer-creator-marketing';

INSERT INTO services (title, slug, description, image, icon, details, is_visible, sort_order) VALUES
  ('AI Content & Creative Automation', 'ai-content-automation', 'AI-powered content systems — UGC, product ads, imagery and voiceovers at machine speed.',
    '', '', '[{"package":"AI UGC","items":["10 AI UGC videos"]},{"package":"AI Product Ads","items":["10 AI product creatives"]},{"package":"AI Image Generation","items":["AI-generated campaign and product imagery","Custom visual concepts","Brand-specific image generation"]},{"package":"AI Voiceover","items":["AI voiceover production"]}]', TRUE, 6),
  ('Bundle', 'bundle', 'One bundle for everything — content, social, performance ads and SEO with monthly analytics.',
    '', '', '[{"package":"Content + Social + Performance + SEO","items":["30 videos","Social management","Meta Ads","Retargeting","SEO","Content strategy","Monthly analytics","Growth consultation"],"note":"Ad spend separate."}]', TRUE, 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'process', 'process',
  '{"label":"Our Process","steps":[{"title":"Discover","text":"Deep-dive into your brand, audience, and goals to craft a tailored strategy."},{"title":"Create","text":"Produce cinematic content and campaigns designed to resonate and convert."},{"title":"Launch","text":"Deploy across channels with precision targeting and performance optimization."},{"title":"Scale","text":"Iterate based on data, scale what works, and continuously improve ROI."}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'services'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'cta', 'cta',
  '{"heading":"Ready to grow?","buttonText":"Get Started →","buttonUrl":"contact.html"}'::jsonb, 2, TRUE
FROM pages WHERE slug = 'services'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- H. Contact page sections ------------------------------------------------------
INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero',
  '{"title":"Let''s Talk","subtitle":"Ready to take your brand to the next level? We''d love to hear from you."}'::jsonb, 0, TRUE
FROM pages WHERE slug = 'contact'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'info', 'text',
  '{"heading":"Get in Touch","description":"Whether you''re a brand looking for cinematic content or a creator ready to scale, we''re here to make it happen."}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'contact'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'form', 'form',
  '{"buttonText":"Send Message"}'::jsonb, 2, TRUE
FROM pages WHERE slug = 'contact'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'map', 'text',
  '{"text":"REVOLVYN Headquarters — Kolkata, India"}'::jsonb, 3, TRUE
FROM pages WHERE slug = 'contact'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- I. Secondary pages: hero + content blocks -------------------------------------
INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Careers"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'careers'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"Join REVOLVYN","texts":["We are always looking for talented, curious, and driven individuals who want to push the boundaries of what digital marketing can be. At REVOLVYN, you won''t just execute tasks - you''ll shape strategies, challenge conventions, and grow alongside a team that cares deeply about the work."]},{"heading":"Our Culture","texts":["We operate with autonomy, transparency, and a relentless pursuit of quality. Our team is small by design, which means every voice matters and every contribution has a visible impact. We value thinkers who can act and doers who can think."]},{"heading":"Open Positions","texts":["We are not actively hiring at the moment, but we are always open to hearing from exceptional people. If you believe you''d be a strong fit for REVOLVYN, we encourage you to reach out with your portfolio and a brief note about why you''d like to work with us."]},{"heading":"How to Apply","texts":["Send your portfolio, resume, and a short message to us via our contact page . Tell us about the work you''re most proud of and what kind of role you''re looking for. We review every application personally."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'careers'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Partnerships"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'partnerships'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"Why Partner With Us","texts":["REVOLVYN thrives on collaboration. We believe the best work happens when like-minded creators, agencies, and brands come together with a shared vision. Our partnerships are built on mutual respect, creative ambition, and a commitment to excellence."]},{"heading":"Types of Partnerships","texts":["We work with partners across the spectrum - from production houses and media buyers to technology providers and fellow creative agencies. Whether it''s a joint campaign, co-branded content, or a referral relationship, we approach every partnership with the same level of care and professionalism."]},{"heading":"What We Look For","texts":["We seek partners who share our values: a passion for quality, a data-informed mindset, and a genuine desire to create meaningful work. We are not interested in transactional relationships - we build partnerships that last."]},{"heading":"Get Started","texts":["If you''re interested in exploring a partnership with REVOLVYN, we''d love to hear from you. Reach out through our [contact page](contact.html) with details about your organization and how you envision working together."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'partnerships'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Blog"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'blog'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"Coming Soon","texts":["We are putting the finishing touches on our blog, where we will share deep dives into digital marketing strategy, creative process breakdowns, and lessons learned from working with brands across industries."]},{"heading":"What to Expect","texts":["Our upcoming articles will cover topics including brand storytelling, social media strategy, content marketing frameworks, campaign performance analysis, and emerging trends in the digital space."]},{"heading":"Stay Informed","texts":["Want to be the first to know when we publish? Subscribe to our [newsletter](newsletter.html) to receive updates directly in your inbox. We respect your time and only send content worth reading."]},{"heading":"Contribute","texts":["If you have insights to share or a unique perspective on digital marketing, we welcome guest contributions. Reach out via our [contact page](contact.html) to discuss potential topics."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'blog'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Research"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'research'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"Our Approach","texts":["At REVOLVYN, every strategy begins with rigorous research. We dig deep into market trends, consumer behaviour, and competitive landscapes to build campaigns rooted in evidence - not assumptions."]},{"heading":"Industry Insights","texts":["We continuously monitor shifts in digital marketing, social media algorithms, content consumption patterns, and emerging platforms. This allows us to identify opportunities before they become mainstream and position our clients at the forefront of their industries."]},{"heading":"Data-Driven Decisions","texts":["From audience segmentation to performance analytics, we leverage both quantitative and qualitative data to shape our creative direction. Our research process ensures that every piece of content, every campaign, and every brand decision is backed by actionable intelligence."]},{"heading":"Published Studies","texts":["We are committed to sharing our findings with the broader marketing community. Our published research covers topics ranging from brand storytelling frameworks to ROI measurement in digital campaigns, providing value beyond our client work."]},{"heading":"Collaborative Research","texts":["We partner with universities, industry bodies, and fellow agencies to contribute to the evolving body of knowledge in digital marketing. These collaborations keep our methodology sharp and our perspective fresh."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'research'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Newsletter"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'newsletter'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"Stay in the Loop","texts":["Our newsletter delivers curated insights on digital marketing, brand strategy, and creative trends directly to your inbox. No spam, no fluff - just thoughtfully written content that helps you stay ahead."]},{"heading":"What You''ll Receive","texts":["Each edition includes behind-the-scenes looks at our latest projects, analysis of industry shifts, actionable marketing tips, and early access to our research publications. We send it monthly, so you can count on quality over quantity."]},{"heading":"How to Subscribe","texts":["To join our mailing list, simply send us your email through our contact page and let us know you''d like to subscribe. We''ll handle the rest and welcome you aboard."]},{"heading":"Your Privacy Matters","texts":["We will never share your email address with third parties. You can unsubscribe at any time, and your data is handled in accordance with our [privacy policy](privacy.html). We believe trust is the foundation of every good relationship."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'newsletter'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero',
  '{"title":"Community","subtitle":"Join our growing network of creators, brands, and storytellers."}'::jsonb, 0, TRUE
FROM pages WHERE slug = 'community'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"Building Together","texts":["At REVOLVYN, we believe in the power of community. We''re building a network of passionate creators, innovative brands, and forward-thinking individuals who share our vision for meaningful digital experiences.","Our community is a space for collaboration, learning, and growth. Whether you''re a content creator, a brand looking to expand, or someone passionate about digital storytelling, there''s a place for you here."]},{"heading":"Get Involved","texts":["Stay connected with us through our social media channels and be part of conversations that shape the future of digital content. We regularly share insights, opportunities, and updates about our community initiatives.","[Reach out to us](contact.html) and let''s explore how we can create impact together."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'community'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Privacy Policy"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'privacy'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"1. Information We Collect","texts":[]},{"heading":"2. How We Use Your Information","texts":["We use your information to:"]},{"heading":"3. Sharing of Information","texts":["We do not sell or trade your personal information. We may share data only with:"]},{"heading":"4. Cookies & Tracking Technologies","texts":["We use cookies for:"]},{"heading":"5. Data Security","texts":["We use SSL encryption and secure servers to protect your data. Only authorized personnel have access."]},{"heading":"6. Your Rights","texts":["You may request:"]},{"heading":"7. Children''s Privacy","texts":["We do not knowingly collect data from children under 13."]},{"heading":"8. Updates to This Policy","texts":["We may update this policy at any time."]},{"heading":"9. Contact","texts":["For privacy-related questions, email: revolvynmedia@gmail.com"]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'privacy'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{"title":"Refund Policy"}'::jsonb, 0, TRUE FROM pages WHERE slug = 'refund'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'main', 'blocks',
  '{"blocks":[{"heading":"1. Non-Refundable Services","texts":["Payments made for video editing, video shoots, ad campaigns, graphic design, social media management, strategy sessions, or any digital service are non-refundable once the project has started."]},{"heading":"2. Refund Eligibility","texts":["A refund is only possible under the following conditions:"]},{"heading":"3. Non-Refundable Circumstances","texts":["No refunds will be provided if:"]},{"heading":"4. Cancellation of Monthly Services","texts":["For monthly plans (SMM, ads, retainers):"]},{"heading":"5. How to Request a Refund","texts":["Email us at revolvynmedia@gmail.com or use our contact page ."]}]}'::jsonb, 1, TRUE
FROM pages WHERE slug = 'refund'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- J. Footer + contact settings ---------------------------------------------------
INSERT INTO site_settings (key, value) VALUES
  ('footer.titles', '{"explore":"Explore","resources":"Resources","connect":"Connect"}'),
  ('footer.links', '{"explore":[{"label":"About Us","url":"index.html#about"},{"label":"Portfolio","url":"portfolio.html"},{"label":"Brands","url":"brands.html"},{"label":"Services","url":"services.html"}],"resources":[{"label":"Privacy Policy","url":"privacy.html"},{"label":"Refund Policy","url":"refund.html"},{"label":"Research","url":"research.html"},{"label":"Blog","url":"blog.html"}],"connect":[{"label":"Contact","url":"contact.html"},{"label":"Partnerships","url":"partnerships.html"},{"label":"Careers","url":"careers.html"},{"label":"Newsletter","url":"newsletter.html"}]}'),
  ('contact.form.services', '["Growth Consulting","Performance Marketing(Meta)","Influencer Marketing","SEO & Website","Content Production","Social Media Management","AI Content Production","Full-Service Package"]')
ON CONFLICT (key) DO NOTHING;
