# Five minute walkthrough

Use **one browser** with **two tabs**. The demo keeps its data inside the browser, so the phone and laptop do not share it. Open the site in tab 1 and the admin in tab 2.

Start with a clean slate: in the admin, click **Reset demo data** in the sidebar.

## 1. Look around the site (tab 1, 1 minute)

1. Open the home page. Scroll past the hero, the moving services strip and the services.
2. In **Services** click the **Skin** tab, then **Brows and waxing**. Notice the prices say "Price on request" because none are published yet.
3. Scroll to **Our work**. Tap **Colour**, then **All**. Click a photo. Use the left and right arrow keys, then **Escape**.
4. Scroll to **Visit** and note today's hours are highlighted. Add `?review=1` to the address to see what still needs confirming, and `?review=0` to hide it again.

## 2. Book a time (tab 1, 1 minute)

1. In **Services** click **Book this** on **Haircuts**. The booking form opens with Haircuts chosen.
2. Pick a **day**, then a **time**. Greyed out times are already taken.
3. Enter a name and a 10 digit phone number. Leave the offers box unticked. Click **Request this time**.
4. Read the confirmation. Note the small "This is a demo, nothing was sent." message. Click **Book another time**.

## 3. See it land in the admin (tab 2, 1 minute)

1. Open `/admin/login` and click **Sign in as owner**.
2. Open **Booking requests**. Your request is at the top, marked **New**. (Book once more in tab 1 and watch a second one appear within a second.)
3. Click it. Read the details on the right.

## 4. Confirm it and watch the slot disappear (1 minute)

1. Click **Confirm and text**. A message appears saying the text is in **Sent messages**.
2. Open **Sent messages** to see the text the client would have received.
3. Switch to tab 1 and look at the same day and time in the booking form. It is now greyed out and says taken. No refresh needed.
4. Back in the admin open **Calendar**. The booking is on the grid. Click it to see **Move** and **Cancel booking**.

## 5. Change a price (1 minute)

1. In the admin open **Services and prices**. Type `85` in the Haircuts price box and press Enter. A small **Saved** appears.
2. Switch to tab 1, open **Services**, and see **From $85** on Haircuts.
3. Turn off the **Facials** switch. Facials disappears from the site and from the booking picker.
4. Open **Gallery**, hide a photo, and see it vanish from **Our work**.

## Finish

Click **Reset demo data** to put everything back. Try **Settings**: turn off **Accept online requests** and the booking form says requests are paused.
