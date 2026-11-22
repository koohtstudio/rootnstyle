# Content to confirm before launch

Add `?review=1` to any page to see each unconfirmed fact marked on the page as `[confirm]`. Add `?review=0` to turn it off. Visitors never see these markers.

## From CONTENT.md (owner must confirm)

- [ ] **Service menu, prices and durations.** None are published. The site says "Price on request" and hides times until the owner enters them in Admin.
- [ ] **Unit number and a map pin** for 10940 Goreway Dr.
- [ ] **Final opening hours.** Sources differ slightly. Current: closed Monday, Tuesday to Saturday 10 am to 7 pm, Sunday 10 am to 6 pm.
- [ ] **Owner story, team names and photos.** The About page uses neutral wording. The team block shows only in review mode.
- [ ] **Three real reviews with permission.** The three cards are labelled placeholders. The rating (4.6, 359 reviews) is copied from CONTENT.md and must be rechecked at launch.
- [ ] **Original photos and each client's OK.** Current photos are from the old Wix site and Instagram.
- [ ] **Which logo is current.** See the logo note below.
- [ ] **Online booking provider.** Own system (this build), Fresha or Square. And the text sender number.
- [ ] **Instagram handle and follower count, plus Facebook and TikTok links.** Only Instagram is linked today, and the handle is unconfirmed.
- [ ] **Whether Join the team should list open roles.** It says "always glad to meet" for now.

## Things this build added that the owner should know about

- **Logo mismatch.** The site uses `logo-ig.png` (burgundy script on peach, matches the Instagram and the palette). `public/images/logo.jpg` (blue and purple from the old website) is kept but unused. If the salon still uses the blue and purple mark, the palette and logo need a decision.
- **Two photos contain a mouse cursor.** `work-waves.jpg` and `work-highlights.jpg` look like screen captures and show a cursor. Replace them with the originals.
- **Photo titles and filter tags** (Colour, Styling, Cuts) are sample choices. Review mode marks them.
- **Service descriptions** are sample copy. Review mode marks them.
- **Sample bookings and client names** in the admin are made up and use the fictional 555 phone range.
- **Booking capacity is one chair.** A confirmed booking blocks the whole salon for its length. If several stylists take bookings at once, staff need to be added to the data model.
- **Slot length** uses 60 minutes when a service has no time set.
- **Lead time.** Times in the next 60 minutes are not offered online.
- **Privacy page** is a plain summary. Replace with the salon's real policy.
- **Booking messages wording** (`lib/repo/mock/messages.ts`) is draft copy for the owner to approve.
