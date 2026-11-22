# Importing the real menu and photos

## Service menu

1. Ask the owner for the final list: name, group (hair, skin, brows, makeup), a one line description, price and time in minutes. Leave price or time empty if she does not want to show it. The site then says "Price on request".
2. Put the rows in `neon/seed.sql` (the `insert into public.services` block), or load a CSV:

```sql
create temp table menu_import (id text, category_id text, name text, description text, price numeric, duration_min int, sort int);
\copy menu_import from 'menu.csv' csv header
insert into public.services (id, category_id, name, description, price, duration_min, sort)
select id, category_id, name, description, price, duration_min, sort from menu_import
on conflict (id) do update set name = excluded.name, description = excluded.description,
  price = excluded.price, duration_min = excluded.duration_min, sort = excluded.sort;
```

3. Use a short, stable `id` (for example `haircuts`). Booking links use it.
4. For a quick change later, the owner edits price and time inline in **Admin, Services and prices**.

## Photos

1. Ask the owner for **original** photos and written permission from each client. The current photos come from the old Wix site and Instagram and should be replaced.
2. Resize to at most 2000 px on the long side. Strip location data (`exiftool -all= photo.jpg`).
3. Upload to the Neon Object Storage bucket under `gallery/`.
4. Insert a row per photo with a real `alt` and the right `tag` (`colour`, `styling` or `cuts`). Leave `consent_ok` false until the client says yes.

```sql
insert into public.gallery_photos (title, tag, storage_key, alt, sort, consent_ok)
values ('Copper caramel waves', 'colour', 'gallery/work-copper.jpg',
        'Long copper and caramel waves falling past the shoulders, seen from behind', 20, true);
```

5. For the static demo images in `public/images`, replace the files with the same names, run `pnpm images` to refresh blur placeholders, and commit.

## Existing bookings

If the salon has bookings elsewhere, import them into `bookings` with status `confirmed`. Phone numbers must be 10 digits. The exclusion constraint will reject overlaps, which is useful: it points at double bookings in the old data.
