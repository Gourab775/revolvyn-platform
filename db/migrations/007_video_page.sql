-- ─── 007_video_page: player-page labels (idempotent) ──────────────────────────
-- video.html is a dynamic player (title/video come from the link that opened
-- it, i.e. from portfolio items). Only its fixed chrome labels live here.

INSERT INTO pages (slug, name, status) VALUES
  ('video', 'Video player', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO page_sections (page_id, section_key, section_type, data, sort_order, is_visible)
SELECT id, 'labels', 'labels',
  '{"channelTag":"Creative Studio","shareText":"Share","workText":"Work With Us","workUrl":"contact.html","commentsTitle":"Comments","commentPlaceholder":"Add a comment...","moreTitle":"More from REVOLVYN","showMore":"Show more","showLess":"Show less","loadingText":"Loading video...","unavailableText":"Video unavailable.","unavailableLinkText":"View on portfolio","unavailableLinkUrl":"portfolio.html","viewsWord":"views"}'::jsonb, 0, TRUE
FROM pages WHERE slug = 'video'
ON CONFLICT (page_id, section_key) DO NOTHING;
