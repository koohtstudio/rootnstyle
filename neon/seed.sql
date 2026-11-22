-- Roots n Style starting data. Run AFTER neon/migrations/0001_init.sql. Safe to re-run.
-- Everything here comes from CONTENT.md. Prices and durations are NULL on purpose:
-- the salon has not published them, so the site says "Price on request" until the owner sets them.
-- Descriptions and photo titles are sample copy. Gallery rows need real files in object storage first.

begin;

insert into public.service_categories (id, label, sort) values
  ('hair', 'Hair', 10), ('skin', 'Skin', 20), ('brows', 'Brows and waxing', 30), ('makeup', 'Makeup', 40)
on conflict (id) do update set label = excluded.label, sort = excluded.sort;

insert into public.services (id, category_id, name, description, sort) values
  ('haircuts',                  'hair',   'Haircuts',                        'A cut shaped around your hair and your day.', 10),
  ('styling-blowouts',          'hair',   'Styling and blowouts',            'Smooth, curled or sleek, styled for the occasion.', 20),
  ('colour-root-touchups',      'hair',   'Colour and root touch-ups',       'Fresh colour and tidy roots, matched to your tone.', 30),
  ('highlights-balayage',       'hair',   'Highlights and balayage',         'Soft, sun-kissed dimension painted in by hand.', 40),
  ('keratin-hair-botox',        'hair',   'Keratin and hair botox',          'Smoothing treatments for frizzy or tired hair.', 50),
  ('facials',                   'skin',   'Facials',                         'A calming facial that leaves skin fresh and comfortable.', 60),
  ('hydrafacial',               'skin',   'Hydrafacial',                     'A deep clean and hydrating treatment for a clear finish.', 70),
  ('microneedling',             'skin',   'Microneedling',                   'A skin treatment focused on texture and tone.', 80),
  ('microdermabrasion',         'skin',   'Microdermabrasion',               'Gentle exfoliation for smoother looking skin.', 90),
  ('peels-dermaplaning',        'skin',   'Chemical peels and dermaplaning', 'Peels and dermaplaning to brighten and smooth.', 100),
  ('eyebrow-threading',         'brows',  'Eyebrow threading',               'Clean, defined brows shaped with thread.', 110),
  ('waxing',                    'brows',  'Waxing',                          'Quick, careful waxing for smooth results.', 120),
  ('event-party-bridal-makeup', 'makeup', 'Event, party and bridal makeup',  'Makeup for weddings, parties and special days. Groups welcome.', 130)
on conflict (id) do update set name = excluded.name, description = excluded.description, sort = excluded.sort;

-- 0 = Sunday. Monday closed. [confirm] final hours with the owner.
insert into public.hours (day, open_time, close_time, closed) values
  (0, '10:00', '18:00', false), (1, '10:00', '19:00', true),  (2, '10:00', '19:00', false),
  (3, '10:00', '19:00', false), (4, '10:00', '19:00', false), (5, '10:00', '19:00', false),
  (6, '10:00', '19:00', false)
on conflict (day) do update set open_time = excluded.open_time, close_time = excluded.close_time, closed = excluded.closed;

insert into public.settings (id, accept_online, notify_owner, auto_confirm, contact_phone, contact_email, contact_address, contact_instagram)
values (1, true, true, false, '905 794 3373', 'rootsnstyle@gmail.com', '10940 Goreway Dr, Brampton, ON L6P 4N4', '@rootsnstyle')
on conflict (id) do nothing;

-- Gallery: upload the originals to object storage first (see docs/MIGRATION.md), then insert rows like this.
-- consent_ok must stay false until the client has agreed to share the photo.
--
-- insert into public.gallery_photos (title, tag, storage_key, alt, sort, consent_ok) values
--   ('Copper caramel waves', 'colour', 'gallery/work-copper.jpg', 'Long copper and caramel waves falling past the shoulders, seen from behind', 20, false);

-- First owner. Replace the id with the Neon Auth user id of the owner after she signs up.
-- insert into public.profiles (auth_user_id, display_name, role) values ('<neon auth user id>', 'Owner', 'owner');

commit;
