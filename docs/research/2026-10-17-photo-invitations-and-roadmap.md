# Photo invitations and the next plan for the app

Date: 2026-10-17. Status: research and recommendation, not a spec. Nothing here is implemented.

How to read this: every claim is tagged **Fact** (measured in this repo, or stated on a primary source), **Source** (a secondary or vendor source, treat with caution), **Inference** (my reasoning from the facts) or **Unverified** (needs a test or a check before anyone relies on it).

## 1. The question

Add a section where a couple uploads a bride photo, a groom photo and a background photo and gets an invitation made from them. Decide what to introduce, how many of each, and what to do about the existing app, which is weak on design quality and flexibility.

## 2. What the app can and cannot do today

| Area | State | Basis |
|---|---|---|
| Designs | 25, of which 3 are customizable (Rajmahal, Gopuram, Marigold Mela) | Fact: `editable: true` in `src/data/templates.js` |
| What a couple can change | 54 text, date and time fields; nothing else | Fact: `src/studio/fields.js` |
| Photos | None in the data model. Only the original Sundowner invite shows a bride photo, a groom photo and a background, and it hard-codes them as files in `public/invite-media` | Fact: `SealInvite.jsx` lines 5-10 |
| Look and feel | Palette, fonts, section order and section presence are fixed per design | Fact: no such fields exist |
| Sharing | A link whose `#d=` part carries the whole invitation (cap 12,000 characters) | Fact: `src/studio/codec.js` |
| Link preview in WhatsApp | The page has no Open Graph tags at all | Fact: `grep -c "og:" index.html` returns 0 |
| RSVP | Submitting the form only shows a thank-you; the couple hears nothing unless the guest then taps a pre-filled WhatsApp or email link | Fact: `RsvpForm.jsx` |
| Music | Wired into the original invite only. The audio file is missing (`public/audio` holds only `.gitkeep`), but the invite hides the music button when the file fails to load, so nothing breaks; no music plays | Fact (corrected 2026-10-17: the first version of this memo implied a broken button) |
| Fonts | One stylesheet from Google Fonts lists about 45 families; the landing page now loads 2 font files | Fact |
| Languages | Content can be typed in any script; the page text is English only | Inference from the code |

## 3. Can photos travel inside the link?

Measured on the original invite's bride photo (476x499, 26 KB) and background (1024x1536, 201 KB), re-encoded in the browser. Characters are the base64 length that would go into the link. Fact (measurement); it used one portrait and one background, so real photos will vary.

| Image | Size | WebP q0.5 | WebP q0.7 |
|---|---|---|---|
| Portrait | 96 px wide | 2,014 chars | 2,366 chars |
| Portrait | 128 px wide | 2,784 chars | 3,267 chars |
| Portrait | 256 px wide | 6,062 chars | 7,422 chars |
| Background | 64 px wide | 3,243 chars | 3,750 chars |
| Background | 128 px wide | 8,216 chars | 9,960 chars |
| Background | 800 px wide | 96,427 chars | 123,083 chars |

Reading: two 96 px portraits plus a 64 px background is about 7,300 characters, which fits under the 12,000 cap with the text. But a 96 px portrait shown at 150 to 200 CSS pixels is soft, and a 64 px background is only usable as a heavily blurred colour wash. A usable background (800 px) is eight times the cap. Inference: **photos in the link are a fallback, not the product.** Whether messaging apps handle 9,000-character links well is Unverified.

## 4. Options for hosting the photos

| Option | What it gives | What it costs | Verdict |
|---|---|---|---|
| A. Tiny photos inside the link | No backend, works today | Soft faces, no real background, long ugly links | Fallback only |
| B. Object storage plus a small edge function (Cloudflare R2 and Workers) | Real photos, short links, per-invite link previews | Ends the "no backend" rule; needs an approved host and a privacy review | **Recommended** |
| C. Backend-as-a-service (Firebase, Supabase) | Faster start, auth and database included | More vendor surface; not researched in depth here | Viable alternative; Unverified |
| D. Photos kept on the couple's device only | Nothing leaves the phone | Guests never see them | Rejected |
| E. Export a finished image or video to send in WhatsApp | Works without hosting; the common habit | Loses interactivity (countdown, RSVP, map) | A complement later, not a substitute |

Why B (Fact unless noted):
- Cloudflare's pricing page (stated last updated 1 Oct 2026) lists R2 Standard at 10 GB-month free, 1 million Class A and 10 million Class B operations free, then $0.015 per GB-month, $4.50 per million Class A, $0.36 per million Class B, and no egress charge.
- Inference, using the measurements above: a processed invite (two 640 px portraits and one 1280 px background) is roughly 0.3 to 0.4 MB, so the free storage covers on the order of 25,000 invites and three uploads per invite use a tiny share of the free operations. Re-check with real photos.
- Link previews: WhatsApp builds its preview from the raw HTML and does not run page scripts (Source: several guides, none official). A `#` fragment is never sent to a server (Inference), so today's links cannot carry a per-invitation preview even if tags existed. A path link such as `/i/<id>` served by an edge function can. Images for previews should be JPEG or PNG, absolute HTTPS, ideally 1200x630 and under 300 KB (Source; the guides disagree between 300 and 600 KB).
- GitHub Pages cannot run server code, so this means moving the site, or putting a Worker in front of it. A host change needs MathCo IT approval.

## 5. How the upload should work (so it is safe and good-looking)

1. **Pick and decode.** Use a file input with `accept="image/*"` and decode with `createImageBitmap`. Its default `imageOrientation: "from-image"` applies the phone's rotation flag (Fact, MDN), so portraits stand upright.
2. **HEIC from iPhones.** Converter vendors say HEIC keeps rotation in the container rather than EXIF (Source). How Safari hands a library photo to a file input is **Unverified**: test on real iPhones. Fallback: a clear message asking for a JPEG or PNG.
3. **Crop to the slot, not freely.** Each slot has a fixed shape (for example 4:5 portrait, 9:16 background with a focal point). WCAG 2.2 SC 2.5.7 (Level AA) says anything done by dragging must also work without dragging: provide pan buttons, a zoom slider and tap-to-centre, not only drag (Fact, W3C).
4. **Resize and re-encode in the browser.** Portraits to 640 px, background to 1280 px, WebP at about quality 0.75. Whether Safari can encode WebP from a canvas is **Unverified**: keep a JPEG fallback. Re-encoding through a canvas drops camera metadata, which also removes location data (Source).
5. **Text over a photo needs a scrim.** Put a semi-transparent gradient or panel behind names and check 4.5:1 against the lightest part of the photo, not the average (Fact, W3C F83 and Acquia guidance).
6. **Allow only our own image host.** The share data may name photos only as paths on our bucket; the sanitiser rejects any other URL. This keeps the existing rule that a link can never load content from elsewhere.
7. **Always have a no-photo state.** A missing, slow or broken image falls back to the design's own illustration or the design's ground colour.

## 6. Safety, privacy and escalation

These are risks to put in front of the right people, not legal advice.

- Photos of identifiable people are personal data (Inference; the sources I found do not discuss photographs). India's DPDP Rules were notified in November 2025 and many duties start 18 months later, around May 2027, but the sources disagree on some dates (Source). Consent, notice, deletion and any photo of a minor need a decision by Legal, not by us.
- Public image URLs invite abuse. Needed at minimum: unguessable random ids, no directory listing, `noindex`, upload size and type limits, rate limiting on the signing endpoint, a takedown route, and a retention rule (for example delete on request and a fixed period after the wedding).
- Cloudflare's docs say a signed upload fails if the client sends a different Content-Type, and CORS limits which origins may upload (Fact). They do not show a size limit on a signed upload; that check must be tested (Unverified).
- The original invite's bride and groom photos are committed under `public/invite-media` and are published with the site. Please confirm the people in them agreed to that, or replace them with illustrations.
- Anything shown to clients goes through MathCo's legal and compliance review. Contacts: dataprivacy@mathco.com and infosec_team@mathco.com for data and security; the HR and legal policy page for legal and compliance (https://mathco.peoplestrong.com/oneweb/#/hris/documents).

## 7. What competitors do

Evidence here is thin: several vendor pages could not be read (Joy returned 403, Zola 404) and most remaining sources are marketing from competitors.

- **Canva** (own page): drag your own photos onto a template; "hundreds of editable designs"; sharing is by download and email (no link or WhatsApp stated).
- **Appy Couple** (own page): RSVP tracking with real-time alerts, custom RSVP questions, guest lists with family groups and plus-ones, galleries, multiple languages, full-screen cover pages. Analytics (who opened it) are not stated.
- **India-focused tools** (vendor pages, Source): link invitations with schedule, maps, music, countdown and RSVP (Invifest); multi-language, RSVP tracking (Digital Vows); view counts and reminders (Samaro); video invitation makers for WhatsApp (ImagineArt, VEED, FlexClip, Vinvite).
- No reliable figure was found for how many Indian invitations go out over WhatsApp, or for digital-invitation adoption. Do not quote one.

Inference: the gap our app can win is Indian-tradition designs plus a link that opens as a real experience; the table stakes we lack are photos, a working RSVP inbox, a proper link preview and music.

## 8. Recommendation: what to introduce, and how many

**One new service** (the foundation): a small Invite Service on Cloudflare (storage for images, short path links `/i/<id>`, per-invite link preview). Without it, nothing below is good.

**Three photo slots at launch:** bride, groom, background. Defer "couple together" and a photo gallery. Reason: every slot multiplies the checks for every design (shape, crop, missing, huge, tiny, dark, light, broken).

**Four new photo-first layouts**, not 25 retrofits:
1. Portrait hero: one full-height photo with names on a scrim.
2. Two portraits: bride and groom in matching frames with names between.
3. Cover story: background photo with a centred card.
4. Quiet frame: blurred background with two framed portraits.
Each is built once and themed (see below), so one layout serves all four traditions.

**Three retrofits** of designs already editable, with a no-photo state kept: Rajmahal (photos inside the jharokha arch), Gopuram, Marigold Mela (photo as a sticker). The other 22 stay illustration-only until there is demand.

**A flexibility pack of four controls** applied to the new layouts and the three retrofits: colour theme (six curated palettes), font pairing (three), section on/off (story, events, gallery later) and music (five licensed tracks, which also fixes the missing file).

**Three supporting features:** an RSVP inbox (replies stored, a count and a list the couple can export), per-guest personal links from a pasted guest list (no backend needed; uses the existing `?to=`), and a real link preview image.

**Deliberately not now:** video export, AI-generated backgrounds, guest photo sharing, a free-form drag-and-drop editor (a Canva clone), accounts and payments.

## 9. Next plan for the existing app

Ranked by what hurts users most.

**P0, trust (small, no backend needed):**
1. RSVP: the thank-you screen makes it look as if the reply was sent. Make "Send your reply on WhatsApp" the clearly required last step until the inbox exists.
2. Add default Open Graph tags and a generic preview image so shared links stop looking blank.
3. Music: no fix needed (the control already hides itself). Supplying licensed audio is a feature, covered in section 8.
4. Confirm the consent position for the photos already published in `public/invite-media` (section 6).

**P1, flexibility (small to medium):**
5. Guest list to personal links in the Studio (paste names, get one link each, send via WhatsApp).
6. Colour theme and font pairing for the three editable designs first.
7. Section toggles (story, events, venue map) so couples can drop what they do not need.
8. Page text in Hindi, Gujarati and Marathi for the gate and fixed headings (content already supports any script).

**P1, design quality (needs your eyes):** this audit measured structure, accessibility and performance but could not look at pixels in this environment. Run a visual critique of the top five designs on a real phone and rank them; fix the bottom two or retire them. Fewer, stronger designs beat 25 uneven ones.

**P2, performance and polish:** self-host and subset the fonts (the 45-family stylesheet is one render-blocking request); add screenshot comparison to the test harness so a design change that breaks the look is caught.

## 10. Order of work and exit checks

| Phase | Contents | Done when |
|---|---|---|
| 0. Decide and quick wins | Items 1-4 above; approval and privacy review for hosting photos | Written approval for the host and a retention rule; items 1-3 shipped |
| 1. Photos MVP | Invite Service, upload and crop, 3 slots, Rajmahal retrofit, no-photo and broken-image states | Upload works on a real iPhone and a low-end Android; harness fixtures for dark, light, tiny, huge and broken photos pass |
| 2. Layouts and flexibility | 4 new layouts, themes, fonts, section toggles, music; Gopuram and Marigold retrofits | Each layout passes the existing proof run plus a photo fixture set at 320, 360, 390 and 1366 px |
| 3. Replies and sharing | RSVP inbox, guest-list links, preview image per invite | A couple can see who replied without touching WhatsApp; link previews verified in WhatsApp |

Sizes are relative (the team's capacity is unknown): phase 0 is small, phase 1 is the largest single step, phases 2 and 3 are medium each.

## 11. Open decisions for the owner

1. Approve ending the "no backend" rule, and which host (the recommendation is Cloudflare; MathCo IT must approve any host that stores couples' photos).
2. Retention: how long are photos kept after the wedding, and who can ask for deletion?
3. Is this a MathCo or client product, or a public tool? That decides whether Legal reviews it before launch.

## Sources

- MDN, `createImageBitmap()` and `imageOrientation`: https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- W3C, WCAG 2.2 Understanding SC 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- W3C, failure F83 (text over images): https://www.w3.org/WAI/WCAG22/Techniques/failures/F83
- Acquia on text over image contrast: https://dev-guides.acquia.com/web-governance/text-top-image-gradient-or-backdrop-filter-should-have-minimum-contrast
- Smashing Magazine, accessible text over images: https://smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1
- Appy Couple features: https://www.appycouple.com/features/
- Canva wedding invitations: https://www.canva.com/wedding-invitations/templates/
- WhatsApp link preview guides (secondary): https://wha.tools/blog/whatsapp-link-preview-not-working, https://opengraphchecker.com/blog/open-graph-whatsapp/, https://htmlcsstoimage.com/features/og-images-for-whatsapp
- Cloudflare R2 signed upload examples (Content-Type and CORS): https://developers.cloudflare.com/r2/examples/aws/aws4fetch
- DPDP Rules 2025 summaries (secondary, dates conflict): https://lexplosion.in/summary-of-the-digital-personal-data-protection-rules-2025/, https://tsaaro.com/blogs/dpdp-rules-2025-explained-full-overview-and-practical-summary
- India invitation tools (vendor pages): https://www.imagine.art/features/indian-wedding-invitation-video-maker, https://samaro.ai/blogs/why-digital-invites-are-the-modern-must-have-for-weddings-and-events, https://wowsly.com/top-10-rsvp-platforms-in-india-2026/
- Competitor comparison pages (vendor-authored): https://cdnserver.greenvelope.com/resources/best-digital-wedding-invitation-platforms
