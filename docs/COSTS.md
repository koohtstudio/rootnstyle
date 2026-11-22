# Monthly cost estimate

Rough, in Canadian dollars at about 1.37 per US dollar, for a single salon with about 150 online booking requests a month. Prices were checked in November 2026 from the providers' pages and change often. Confirm before you quote the owner.

| Item | What it is | Estimate per month |
| --- | --- | --- |
| Vercel | Pro plan, one seat. Hobby is for non commercial use, so a client site needs Pro. | about $27 (US$20) |
| Neon | Launch plan is usage based with no fixed minimum. A tiny always-light database is a few dollars. Neon's own typical example is about US$15. | $3 to $20 |
| Text messages (Twilio) | Outbound Canadian SMS is about US$0.008 per segment plus carrier fees of roughly US$0.015 to US$0.036 per message. Say US$0.04 all in. 150 bookings x 3 texts (request received, owner alert, confirmation) is about 450 texts. | about $25 (US$18) |
| Number (Twilio) | One local number, about US$1.15 per month. Texting a Canadian audience may need sender registration, which has a one time fee. | about $2 |
| Email (Resend) | Free up to 3,000 emails a month, plenty for booking messages. | $0 |
| Domain | `.ca` or `.com`, about $20 to $25 a year. | about $2 |
| **Total** | | **about $60 to $75** |

## Ways to spend less

- Send the owner alert by email instead of text. That removes a third of the texts.
- Skip the "request received" text and show it on screen only.
- Start on Neon Free while launching. Move to Launch when the free limits are close.

## Ways it grows

Text volume is the only cost that scales with bookings. Doubling bookings adds roughly $25 a month. Everything else is flat.

Sources checked: [Neon pricing](https://neon.com/pricing), [Twilio Canada SMS pricing](https://www.twilio.com/en-us/sms/pricing/ca).
