-- ─── REVOLVYN Owner CMS — seed (mirrors current hard-coded site content) ────
-- Safe to re-run (all inserts use ON CONFLICT DO NOTHING / stable keys).
-- Values below are copied verbatim from the existing HTML so the live site
-- looks identical after the CMS takes over rendering.

-- Pages -----------------------------------------------------------------------
INSERT INTO pages (slug, name, status) VALUES
  ('home',      'Home',      'active'),
  ('portfolio', 'Portfolio', 'active'),
  ('brands',    'Brands',    'active'),
  ('services',  'Services',  'active'),
  ('contact',   'Contact',   'active'),
  ('about',     'About',     'active')
ON CONFLICT (slug) DO NOTHING;

-- Home sections ---------------------------------------------------------------
INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'hero', 'hero', '{
  "tag": "Free 15 Minute Growth Consultation",
  "heading": "REVOLVYN",
  "description": "We help brands get more customers using high-converting ads & cinematic content.",
  "buttonText": "",
  "buttonUrl": ""
}'::jsonb, 0, TRUE FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'manifesto', 'text', '{
  "label": "Who We Are",
  "heading": "REVOLVYN is a next-gen digital marketing agency built for creators and brands. We work with 110+ YouTubers and 320+ brands, creating 4,500+ ads and campaigns. From influencer marketing to content, performance, SEO, and cinematic films. we do it all. We create, connect, and convert."
}'::jsonb, 1, TRUE FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'quote', 'quote', '{
  "quote": "\\"Some ideas are meant to be seen. Ours are meant to be felt.\\"",
  "attribution": "-Swapnil Raymandal, Founder"
}'::jsonb, 2, TRUE FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'cta', 'cta', '{
  "heading": "Step into the Journey",
  "buttonText": "Contact Us",
  "buttonUrl": "contact.html"
}'::jsonb, 3, TRUE FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'footer', 'footer', '{
  "brandName": "REVOLVYN",
  "brandDescription": "From bold ideas to meaningful experiences, we turn creativity into impact."
}'::jsonb, 4, TRUE FROM pages WHERE slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

-- Portfolio items (home grid videos — same Wix URLs as index.html) ------------
INSERT INTO portfolio_items (title, slug, description, thumbnail, video_url, client_name, category, is_visible, sort_order) VALUES
  ('Project One',   'project-one',   '', '', 'https://video.wixstatic.com/video/4c7a69_14df8fc89d244a96b8926669d3d7db8d/360p/mp4/file.mp4', '', 'Video', TRUE, 0),
  ('Project Two',   'project-two',   '', '', 'https://video.wixstatic.com/video/4c7a69_e9c69930b4f74394a7a24aaa079c9e50/360p/mp4/file.mp4', '', 'Video', TRUE, 1),
  ('Project Three', 'project-three', '', '', 'https://video.wixstatic.com/video/4c7a69_0abcdc24eaed4b3e95a67da99aa1a2b0/360p/mp4/file.mp4', '', 'Video', TRUE, 2),
  ('Project Four',  'project-four',  '', '', 'https://video.wixstatic.com/video/4c7a69_ae60f198c15a4dabbec575bb07569699/360p/mp4/file.mp4', '', 'Video', TRUE, 3),
  ('Project Five',  'project-five',  '', '', 'https://video.wixstatic.com/video/4c7a69_95ce005d31f74d3bb9dbc36e126d5556/360p/mp4/file.mp4', '', 'Video', TRUE, 4),
  ('Project Six',   'project-six',   '', '', 'https://video.wixstatic.com/video/4c7a69_1e1da840cb98495a85faf9d92e5b7cb8/360p/mp4/file.mp4', '', 'Video', TRUE, 5)
ON CONFLICT (slug) DO NOTHING;

-- Brands (same 25 Wix logos as brands.html, same order) ------------------------
INSERT INTO brands (name, slug, logo, website_url, is_visible, sort_order) VALUES
  ('WiseLife',       'wiselife',       'https://static.wixstatic.com/media/4c7a69_122e0452342747ababa9b77cc7ae7d42~mv2.png', '', TRUE, 0),
  ('Vedapure',       'vedapure',       'https://static.wixstatic.com/media/4c7a69_84800df9d4764b6a96da485d80f51fee~mv2.png', '', TRUE, 1),
  ('Vedamm',         'vedamm',         'https://static.wixstatic.com/media/4c7a69_89672f0d707f4fd9a81be679a9b68d72~mv2.png', '', TRUE, 2),
  ('Varco',          'varco',          'https://static.wixstatic.com/media/4c7a69_21cecca8bcba479aa695fef5a897b132~mv2.png', '', TRUE, 3),
  ('Vanesa',         'vanesa',         'https://static.wixstatic.com/media/4c7a69_86fefa5f583948bda0e923a33b054995~mv2.png', '', TRUE, 4),
  ('Trend AI',       'trend-ai',       'https://static.wixstatic.com/media/4c7a69_35b7301f889541afbbf1f855d3b8910a~mv2.png', '', TRUE, 5),
  ('Tramontina',     'tramontina',     'https://static.wixstatic.com/media/4c7a69_6acd0ddf326d486cb2264f7c598785c2~mv2.png', '', TRUE, 6),
  ('Sonepar',        'sonepar',        'https://static.wixstatic.com/media/4c7a69_e3c82f0f61014da7a5d661c27d33e3df~mv2.png', '', TRUE, 7),
  ('QuenchLabs',     'quenchlabs',     'https://static.wixstatic.com/media/4c7a69_7fa711bbd523499f897423468e6d52fb~mv2.png', '', TRUE, 8),
  ('Prestige',       'prestige',       'https://static.wixstatic.com/media/4c7a69_2145240bb94147cbbc846f35a2281c7b~mv2.png', '', TRUE, 9),
  ('Protyze',        'protyze',        'https://static.wixstatic.com/media/4c7a69_7ca7056bc7714fab8a72a7ef2dccbd6a~mv2.png', '', TRUE, 10),
  ('Optm',           'optm',           'https://static.wixstatic.com/media/4c7a69_c9313ad6766340deb1558de612818723~mv2.png', '', TRUE, 11),
  ('Lovable',        'lovable',        'https://static.wixstatic.com/media/4c7a69_1e696572a9be49b19be65d92db691063~mv2.png', '', TRUE, 12),
  ('Invigo',         'invigo',         'https://static.wixstatic.com/media/4c7a69_00e3b48bcd8c419dba42ac714c5a2d99~mv2.png', '', TRUE, 13),
  ('Indulekha',      'indulekha',      'https://static.wixstatic.com/media/4c7a69_ddd08654ce1148c7baf95b33dfb30919~mv2.png', '', TRUE, 14),
  ('iiiEM',          'iiiem',          'https://static.wixstatic.com/media/4c7a69_8305d2c3d31c4188bf80f5ae3359b0d2~mv2.png', '', TRUE, 15),
  ('iPlug',          'iplug',          'https://static.wixstatic.com/media/4c7a69_67f051b043154afc8a0b3d26b98c6261~mv2.png', '', TRUE, 16),
  ('Hoichoi',        'hoichoi',        'https://static.wixstatic.com/media/4c7a69_b2f961c81e7a461a86564cfdfb3208ca~mv2.png', '', TRUE, 17),
  ('Flipkart',       'flipkart',       'https://static.wixstatic.com/media/4c7a69_a4da43038c4e466eb52a901fa78f0135~mv2.png', '', TRUE, 18),
  ('ElevenLabs',     'elevenlabs',     'https://static.wixstatic.com/media/4c7a69_823eca1d31ae4bf7ab2885dadcb33829~mv2.png', '', TRUE, 19),
  ('Cosnet',         'cosnet',         'https://static.wixstatic.com/media/4c7a69_5f454bc912234530b974235ea1ccef18~mv2.png', '', TRUE, 20),
  ('Comet',          'comet',          'https://static.wixstatic.com/media/4c7a69_116cb49e7bbd4784b67f8f6b446c5da1~mv2.png', '', TRUE, 21),
  ('Carbamide Forte','carbamide-forte','https://static.wixstatic.com/media/4c7a69_ecdd842d3ea641589c9dc808e0cc9eb4~mv2.png', '', TRUE, 22),
  ('Bellasot',       'bellasot',       'https://static.wixstatic.com/media/4c7a69_3508188ebc9f4906a56b96632ff76eae~mv2.png', '', TRUE, 23),
  ('Cisco',          'cisco',          'https://static.wixstatic.com/media/4c7a69_1636c4c8b4eb4b74abc6595067781678~mv2.png', '', TRUE, 24)
ON CONFLICT (slug) DO NOTHING;

-- Services (same 6 services as services.html) ----------------------------------
INSERT INTO services (title, slug, description, image, icon, details, is_visible, sort_order) VALUES
  ('Growth Consulting', 'growth-consulting', 'Full marketing strategy, content strategy and paid advertising strategy with weekly consultation.',
    '', '', '[{"package":"Growth Consultant","items":["Full marketing strategy","Content strategy","Paid advertising strategy","Conversion strategy","Campaign planning","Competitor intelligence","Weekly consultation"]}]', TRUE, 0),
  ('Performance Marketing', 'performance-marketing', 'Full-stack performance: Meta ads, retargeting and full-funnel strategy with weekly reporting.',
    '', '', '[{"package":"Full-Stack Performance","items":["Meta Ads","Retargeting","Full-funnel strategy","Creative testing","Landing-page recommendations","Conversion optimization","Audience segmentation","Campaign scaling","Advanced analytics","Weekly reporting"],"note":"Ad spend separate."}]', TRUE, 1),
  ('Website + SEO', 'website-seo', 'Conversion-focused websites and SEO that compounds — technical SEO, content strategy and local SEO.',
    '', '', '[{"package":"Growth Website","items":["Custom website","Advanced UI/UX","Conversion-focused architecture","Landing pages","Advanced forms","Integrations","Technical SEO","Analytics","Conversion tracking","Speed optimization"]},{"package":"SEO Scale","items":["Advanced technical SEO","Content strategy","Multiple content pieces","Competitor research","Local SEO","Content optimization","Conversion optimization"]}]', TRUE, 2),
  ('Content Production', 'content-production', 'Cinematic content at scale — strategy, shoots, scripts, production, editing and grading.',
    '', '', '[{"package":"Content Scale","items":["35–40+ videos/month","Full content strategy","Creative direction","Multiple shoot days","Scripts","Production","Editing","Advanced motion graphics","Color grading","Captions","Content performance analysis","Monthly creative strategy"]}]', TRUE, 3),
  ('Social Media Management', 'social-media-management', 'Full social strategy, planning, reels, carousels, copywriting and community management.',
    '', '', '[{"package":"Social Scale","items":["Full social strategy","Content planning","Reels","Carousels","Stories","Copywriting","Trend research","Competitor analysis","Community management","Performance analysis","Monthly reporting","Creative direction","Platform-specific strategy"],"note":"Content shooting remains separate."}]', TRUE, 4),
  ('Influencer & Creator Marketing', 'influencer-creator-marketing', 'Creator campaigns that convert — strategy, 20 creator videos and performance analysis.',
    '', '', '[{"package":"Creator Campaign","items":["20 creator videos","Creator strategy","Creator sourcing","Campaign management","Performance analysis"]}]', TRUE, 5)
ON CONFLICT (slug) DO NOTHING;

-- Site settings (contact page + footer values, verbatim) -----------------------
INSERT INTO site_settings (key, value) VALUES
  ('contact.email',  '"revolvynmedia@gmail.com"'),
  ('contact.phone',  '"+91 91230 11730"'),
  ('contact.office', '"Kolkata, India"'),
  ('contact.hours',  '"Mon to Fri, 10:00 AM to 5:00 PM IST"'),
  ('social.instagram', '"https://www.instagram.com/revolvynmedia?igsi=bmFlaHFyMG92eDNk"'),
  ('social.facebook',  '"https://www.facebook.com/share/1F5rfL4tPS/?mibextid=LQQJ4d"'),
  ('social.youtube',   '"https://www.youtube.com/@REVOLVYNMEDIA"'),
  ('footer.tagline',   '"From bold ideas to meaningful experiences, we turn creativity into impact."'),
  ('footer.copyright', '"© 2026 REVOLVYN. All futures reserved."')
ON CONFLICT (key) DO NOTHING;
