# Invitation Studio: design spec

Status: for review. Date: 2026-10-15. Implements the request "give the user edit access like a studio so the user can edit and check", then share a link. Plan: `docs/superpowers/plans/2026-10-15-invitation-studio.md`. Earlier plan kept consistent: `docs/PLAN.md` (see section 15 for the three places it differs from the code).

The client has given complete freedom. This spec therefore reshapes the product where the evidence says to, and states every such decision with its reason and cost (section 4).

## 1. Summary

A couple opens `#/studio/<id>`, changes names, date, venue, ceremonies and story in a form, watches the real invitation update inside a phone-sized preview, and sends a link. No account, no backend, no new runtime dependency.

The shape that serves a non-technical couple on a phone fastest:

1. **Customize is the main action of the gallery.** Every editable design card leads with a Customize button; the floating bar on a design has a Customize button; a design that is not yet editable says "Editing soon" rather than hiding the feature.
2. **One schema, one set of sample presets, sparse overrides.** A single field table (`src/studio/fields.js`) drives the form, validation, sanitising, the share link and the sample check. A draft is only what the person changed. `compose(preset, overrides)` returns the same `invite` object the 25 designs already read, so no design needs a new data contract.
3. **The preview is the real app in an iframe** (`#/t/<id>?embed=1`), fed by `postMessage`. Gates, `svh` units, container queries and media queries behave as on a phone because the iframe really has a phone's viewport.
4. **The link carries the data.** `#/t/<id>?d=<payload>`; short edits stay plain and short, heavy edits are deflate-compressed, and a longer "older phones" link is offered when compression was used.
5. **Rajmahal first, then one design at a time.** A design shows Customize only after it passes an "editable-proof" checklist (section 12). A QA flag (`?qa=1`) opens the Studio for any design so all 25 can be tested from day one.

Measured on a throwaway prototype of this plan, built in a scratch copy of the repo (not committed): `npm run lint` clean, 75 unit tests passing, production build passing, Studio browser suite passing for Rajmahal (edit-live, share, hostile, storage, gallery, mobile, focus, proof), and ten deliberate mutations each caught by it (section 13). The same checks also pass under the GitHub Pages base path (`/wedding-invite/`), the existing `scripts/qa-gate.mjs` suite still passes for Rajmahal with the new floating bar, and the basic edit-and-see check passes for all 25 designs. The numbers quoted below come from that prototype and are marked "measured".

## 2. Goals and non-goals

Goals, in priority order:

1. A couple with no technical skill replaces the sample names, date and venue on a phone in under two minutes and knows the result is right.
2. What they see in the preview is what a guest sees (same component, same viewport rules, same data path).
3. Sharing is one tap (copy, WhatsApp, system share) and cannot silently send someone else's sample details.
4. Nothing an editor or a link can contain breaks the layout, runs code, or shows the wrong couple.
5. Free, private (nothing leaves the device except the link the person chooses to send).

Non-goals for this release:

- Accounts, servers, short links, analytics, RSVP collection or delivery tracking (the existing reply-by-WhatsApp/email stays).
- Photos, music, colours, fonts, section order, drag-and-drop or free-form layout. Designs are locked layouts with editable content.
- A variable number of ceremonies or story moments (fixed 4 and 3; see P8).
- Per-couple link previews in WhatsApp (hash routes share one HTML file; unchanged from `docs/PLAN.md`).
- Dark mode for the Studio, right-to-left scripts, translations of the Studio's own interface.
- The original invite (`#/t/original`): its copy is hard-coded; it stays as it is.

## 3. Evidence

### 3.1 What the code says (read directly; file references are to the repo at commit `4683db6`)

| # | Finding | Consequence for the Studio |
|---|---|---|
| E1 | Every design reads only the `invite` prop; shape in `src/data/sample.js` plus optional `invocation`, `greeting`, `event.note`, `contact` in the tradition samples. Four sample objects exist (`sample`, hindu, marwadi, jain), each a strict superset of the first. | Keep `invite` as the contract. Add one lookup (`presets`) and compose edits on top of it. No design needs a new prop. |
| E2 | Gates are `position: fixed; inset: 0` with `height: 100vh; 100dvh` (`src/gallery.css`, `.gate`). The `html` element's overflow is locked while a gate is up (`App.jsx`). Pages use `min-height: 100svh`, `cqw` container units (11 design stylesheets), 59 media queries. | An inline preview would let a gate cover the whole Studio and make media queries answer for the desktop window. The preview must be an iframe. |
| E3 | `useCountdown(iso)` computes the state once, then an interval ticks. When `iso` changes, the state is stale until the next tick; an unparseable date gives `NaN` days. | A half-typed date would print `NaN`. Fix in the shared hook (measured: pure `remaining()` plus 5 lines). |
| E4 | `useReveal(rootRef)` in Rajmahal has no deps, so elements added or replaced later are never observed. Story items use `key={s.year + s.title}`; `key={s.year…}` appears in 24 of 25 designs. | Typing in a story title changes the key, React replaces the `<li>`, the new `<li>` lacks `.in`, and the plaque stays at `opacity: 0`. Measured: the harness catches it. Keys must not come from editable text (checklist item). |
| E5 | The floating bar's share URL is `origin + pathname + #/t/<id>` plus `?to=` only. A guest opening a link sees the gallery navigation ("All designs", previous, next). | A personalised link would be shared without its data, and a guest would browse a gallery. Rebuild the share URL from the current parameters; give guests a smaller bar. |
| E6 | `useRoute()` returns only an id, from `^#\/t\/([\w-]+)`. `open=1` and `to=` are read by two separate regexes. | Replace with a single `parseHash()` returning view, id and parameters. `#/studio/<id>` is a new view. |
| E7 | Every gate (25, plus the reference gate) uses `autoFocus` on its primary button. | Inside an iframe, `autoFocus` moves keyboard focus out of the editor. Measured: focus was stolen on load. Fix with a small child-side focus guard. |
| E8 | `dateLabel`, `timeLabel`, `rsvpBy`, and each event's `day` and `time` are typed strings that duplicate `date`. Parsing them back and rebuilding them reproduces all four presets exactly (unit test). | These are derived, never typed. Ceremony dates become day offsets from the wedding. |
| E9 | `RsvpForm` builds `mailto:${invite.contact.email}?subject=...` from the raw value and `wa.me/${digits}` from the number. | The email must be validated so a link cannot add `?bcc=`; phone numbers get a country-code rule. |
| E10 | `BoardingPass` pads event names to 9 flap cells; monograms use `couple.a[0]` (also in the gallery thumbnails); Marigold Mela sets each name letter by letter from `[...text]`. `name[0]` and `[...text]` split a Devanagari conjunct or an emoji into pieces that render apart. | Per-design checklist items; `firstGrapheme()` and `graphemes()` helpers are provided in `src/lib/fit.js`. |
| E11 | Working-tree files use CRLF (`core.autocrlf=true`; the index is LF). | Scripts that edit files must normalise `\r\n`; do not rewrite line endings. |
| E12 | Every gate renders `invite.couple` and `invite.dateLabel` (`Gate.jsx`), so a gate also shows edited content and can overflow with long names. | Gates are part of "editable-proof", not just pages. |

### 3.2 Competitor editor landscape

Sources are official help pages unless marked. Several vendor pages could not be fetched (noted under "Uncertain"). Treat the table as directional.

| Product | Editing model | Preview | Save and share | What to take |
|---|---|---|---|---|
| Joy (digital cards and website) | Form panel left, preview right; cards use Design, Content and Email sections with a Save each | Live in-page preview with desktop and mobile icons; test email to a verified owner | Starts in Draft with an "Under Construction" guest page; "Share with a Link" or tracked emails; warns when sending while unpublished | Form left, preview right. Warn before sharing unfinished work. |
| Zola | Guided pages and sections; entered info carries over when you switch design | Preview updates as you edit | Drafts autosave | Content separate from design: keep details when switching designs. |
| Canva | Free-form canvas | Live canvas | Autosaves every few seconds, wait for the save icon; version history only on paid plans; editor can lock and stop saving (fix: refresh) | Visible save state. Free-form editing breaks animated layouts: do not copy it. |
| Paperless Post | Free-form text boxes, some template text locked | Test card to yourself (reviewer report, help centre not fetched) | Email, mail or shareable link with optional password | Some wording stays locked. Per-RSVP coin charges are the most-cited complaint (Trustpilot, user-reported). |
| Greenvelope | Template, then wizard: editor then Send tab | "Send a Test Card" to yourself (animated envelope included) | Email, SMS or public Share URL; priced per guest | Preview the real guest experience. For a link, "Open as a guest" replaces an inbox round-trip. |
| Wix | Free-form editor with a separate mobile editor | Preview mode, phone icon | Save, Preview and Publish are separate; the QR code shows the published site, not unpublished edits | Preview must equal what the link shows; the link must carry the edits. |
| Squarespace | Section and block editor | Device view icon, described by Squarespace as an approximation of typical mobile browsers | Separate page preview | A DOM-rendered "mobile view" is only an approximation; an iframe at the real width is not. |
| Appy Couple | Gear icon opens editing controls over the real invitation (official help not fetched) | Inline | Subscription for host tools | Inline editing suits simple content; unverified. |
| Indian invite makers (DesiEvite, WedNicely, Crafty Art, WhatsApp-order video vendors) | Fixed template, a short form: bride, groom, parents, function date, time and venue, optional photo | Mostly none or a final render | Download an image, video or PDF and send on WhatsApp | The fields people expect. The output is a file, not a link that can be corrected after sending. |
| Invifest (microsite, India) | Unknown | Unknown | One link; "editable even after sharing" (marketing claim) | A link with data in it cannot be edited after sharing (see risk R3). |
| WedSites, Liinks (mobile editor reference) | Device toggle; Liinks keeps a live frame above the form and a full-screen toggle | Mobile toggle with "Previewing mobile" label | Draft until publish | Phone-first: frame plus form; keyboard must not hide the controls. |

Patterns the Studio adopts: form beside a live preview, device toggle, autosave with a visible state, structure locked and content editable, content preserved across designs, a share sheet with copy, WhatsApp and system share, a warning when details are still the sample. Patterns it rejects: paywalls and per-guest charges (it is free, and says so), free-form canvases, separate Save buttons per section, version history (a single undo after "Start over" is enough).

Mobile form facts the field table follows (official sources): inputs at 16px or more so iOS does not zoom on focus; `type=tel` with `inputmode=tel` for phones, never `type=number`; native date and time inputs bound to ISO values with the label rendered separately; `autocomplete` only on fields about the person typing (their own phone and email), `off` for other people's names; validate on blur, then on each keystroke once an error shows; visible labels, text errors, targets of 24px (WCAG 2.2 AA) and aim for 44px; character limits counted in graphemes with `Intl.Segmenter` and kept soft.

Uncertain (not verified, do not rely on): Paperless Post and Appy Couple official help; Zola free limits and publish step; Greenvelope pricing page (403); Invifest vendor site; Canva mobile preview; the 7-day Safari storage cap enforcement; Safari `replaceState` rate limit (old sources); WhatsApp and Instagram link length limits (no official figures); `deflate-raw` in Android WebView and in-app browsers (no table row); Intl.Segmenter output for Devanagari conjuncts outside Node 24 (the prototype measured Node only: "श्रीमती" is 3 graphemes and 7 UTF-16 units); iOS native date input quirks (old sources, retest on a real iPhone).

Source list: Joy help articles 8342128 and 12834472 (withjoy.com/help); Zola FAQ 115001755211 and 360009386732; Canva Help "Version history", "Publish websites to a free domain"; Greenvelope support "Send a Test Card"; Squarespace Help "Device view"; Wix Help "Viewing your site on mobile"; WedSites help 14455883; Liinks help "Mobile editing"; DesiEvite (desievite.com); MDN (CompressionStream, localStorage, storage quotas, postMessage, iframe, Intl, fragments); caniuse CompressionStream `deflate-raw`; web.dev (payment and address form practices, Intl.Segmenter, compression streams); WCAG 2.2 Understanding pages 1.3.5, 2.5.5, 2.5.8, 3.3.1, 3.3.2, 3.3.7, 4.1.3; GOV.UK Design System (dates, character count); Baymard (inline validation); NN/g (mobile accordions); Chrome for Developers (viewport resize behaviour); WebKit blog (ITP storage cap); Bitly support (2,048 character limit); OWASP Prototype Pollution cheat sheet; React docs (`dangerouslySetInnerHTML`).

## 4. Decisions, with reasons and costs

Product decisions that change the current shape (the "revamp" list):

| # | Decision | Reason | Cost |
|---|---|---|---|
| P1 | Customize is the primary action: a filled button on every editable gallery card (Preview becomes the secondary link), a Customize button in the floating bar, and "Editing soon" on designs not yet proofed. | A couple arrives to make their own invitation, not to browse. Joy and Zola both put editing in the main path. Showing "Editing soon" is honest about the rollout. | Card markup splits into link plus actions; about 60 lines of CSS; cards are one row (about 62px) taller. |
| P2 | One field table, four presets, sparse overrides; `compose()` outputs the existing `invite`. The four sample files stay separate (they carry community-review comments); `src/data/presets.js` is the single lookup and replaces the `samples` map in `App.jsx`. | One source of truth for form, validation, link and tests; designs untouched; the sample files keep their review history. A merged sample file would churn files that need community review. | About 770 lines of new pure code (schema, sanitiser, compose, codec, store, protocol, helpers) with about 540 lines of unit tests. |
| P3 | Designs get `invite` from one hook: sample, or a decoded link, or the Studio's draft. | The viewer, preview and gallery must agree. | `App.jsx` is restructured: gallery and floating bar move to their own files. |
| P4 | Guests of a personalised link get a smaller bar (Replay and Share). No gallery navigation, no Customize. | A guest opening a couple's invitation is not browsing a gallery (E5). Share must keep the data. | A guest can no longer jump to the gallery from the invitation (open question Q2: a quiet "Make your own" link). |
| P5 | The floating bar becomes icon-first on phones: grid icon (All designs), previous, next, replay, share, and a filled pencil (Customize); the name and counter are screen-reader only below 481px. | Adding a sixth control to a bar built for five does not fit in 296px otherwise (6 x 44px plus gaps is 292px; the `gallery` area checks the bar at 320px). | The text "All designs" is hidden on phones (its accessible name stays). |
| P6 | `editable: true` per design in the registry (`src/data/templates.js`), set in the commit that finishes that design's checklist. `#/studio/<id>?qa=1` opens the Studio for any design for testing. | The user's rollout is design by design. An unproofed design can print `undefined` or overflow when a field is emptied. | One flag per design to flip; the QA flag is a documented, unlinked escape hatch with no security impact. |
| P7 | Display labels are derived: `dateLabel`, `timeLabel`, `rsvpBy`, every event `day` and `time`. Ceremony dates are stored as day offsets from the wedding. The wedding ceremony (`id: 'wedding'`) always follows "The day". | Typing the same date four ways invites disagreement (E8). Offsets keep the schedule's shape when the wedding date moves. | A ceremony date moves when the wedding date moves (helper text says so). |
| P8 | Fixed counts: 4 ceremonies, 3 story moments. | 25 layouts are built for them (Vastu `events[2]`, Gold Mantapa beads, Lagnachauk ring geometry, Boarding Pass flaps). | A couple with two ceremonies must rename two (copy says how). Variable counts per design are open question Q3. |
| P9 | Fix two shared defects the Studio exposes: `useCountdown` (stale, `NaN`) and the share URL dropping data (E3, E5). Fix content-derived keys design by design (E4). | Needed for correctness of every edited invitation. | Small, tested. |
| P10 | Removed from the proposal: free IANA time zone entry (replaced by 13 fixed offsets with DST named); nested JSON payload (replaced by flat short keys); per-tradition drafts (replaced by per-field scope). | See D3 and D4. | None. |

Technical decisions:

**D1. Form panel with a live preview, not inline editing on the canvas.** Inline editing (Appy Couple's gear mode; Squarespace mobile view) needs an edit affordance inside each of 25 different animated, gated, scroll-driven layouts (Haveli Fresco pans sideways on vertical scroll, Ratnatraya Prism snaps a 3D prism, Kathputli Stage is a slider). Dates, ceremonies and long text are safer in typed, labelled fields with validation, and a form is what both research passes recommend for phones. Cost: the person edits in one place and looks in another. Mitigation: the preview scrolls to the section being edited (`data-studio-section`, progressive: designs without anchors ignore it). Future, not now: tap text in the preview to focus its field.

**D2. Iframe preview, not an inline component.** Measured on the prototype: the preview is the real app at the real viewport (390 by 844, 320 by 568 or 1280 by 800), scaled to fit with `transform`. Position-fixed gates, `svh`, `cqw`, `(hover: hover)` and 59 media queries behave as on a device (E2). On a real phone the iframe fills the panel with no frame. Cost: the app runs twice (second document, same cached JS, fonts and CSS). Not measured: memory on a low-end phone (open risk R4). Sandboxing is not used: a same-origin frame with `allow-scripts allow-same-origin` gives no protection, so `postMessage` is protected by origin and source checks instead (section 8).

**D3. Drafts are scoped per field, not per tradition or per design.** The proposal said one draft per tradition. A finer rule is correct: each field is `common` or `tradition`. Names, full names, date, time, zone, venue, city, map, hosts, reply-by, contacts and the three story moments are common: a couple who customises Rajmahal keeps all of that when they try Kohbar Ghar. Ceremonies (names, offsets, times, places, dress, notes), the line before the names, the invocation and the greeting are per tradition: a Hindu "Haldi" never lands on a Jain invitation, and a Ganesh invocation never appears on a Jain one (a cultural error, not just a layout issue). Storage shape: `{ v: 1, common: {...}, trad: { hindu: {...} } }`. Per-design drafts were rejected: someone comparing three designs would retype names three times.

**D4. Link encoding.** `#/t/<id>?d=<payload>`; payload = `j.` or `z.` plus base64url of UTF-8 JSON `{ "v": 1, "f": { <short key>: <string> } }` containing only edited fields that apply to that design. Short keys (`ca`, `e0n`, `s1x`) come from the field table. Measured on the prototype with Node 24 `zlib` (the same algorithm as `CompressionStream('deflate-raw')`) and the real encoder:

| Edited invitation | JSON bytes | plain `j.` chars | compressed `z.` chars | link chosen |
|---|---|---|---|---|
| Names, date, time, venue, city (6 fields) | 136 | 184 | 161 | plain, 184 |
| Plus hosts, two ceremony places, WhatsApp (10 fields) | 304 | 408 | 292 | plain, 408 |
| Realistic full edit in English (38 fields: names, hosts, date, venue, contacts, 4 ceremonies, 3 story moments) | 1,057 | 1,412 | 774 | compressed, 774 |
| The same edit with Devanagari names, hosts, venue, city and two story moments | 1,575 | 2,102 | 1,046 | compressed, 1,046 |
| Worst case: every text field at its maximum length, random Latin | 3,236 | 4,317 | 2,661 | compressed |
| Worst case: every text field at its maximum length, random Devanagari | 8,916 | 11,890 | 4,688 | compressed |

Short keys instead of dotted paths (`couple.a`, `events.0.name`) save about 7 percent compressed and 23 percent plain (measured on a 39-field English edit: 796 versus 858 compressed, 1,454 versus 1,877 plain). A full link adds the host and `#/t/rajmahal?d=` (about 90 characters on GitHub Pages). Realistic links are 270 to 1,150 characters. Even the Devanagari worst case is under 5,000, below the 12,000-character guard, but above the 2,048 characters Bitly shortens; the share sheet warns above 2,000. Brotli would save about another 20 percent (measured on Node in an earlier sample: 604 versus 744 characters) but has less browser support, so it is not used.

Why plain below 1,200 characters: `deflate-raw` needs iOS 16.4, Chrome 103, Firefox 113 or Samsung Internet 20 (caniuse, MDN); Android WebView has no table row. A link that cannot be opened is the worst failure this feature has, and short links need no compression. When compression is used, the share sheet also offers a plain "link for older phones", and a decoder without the API shows "this link needs a newer phone or browser. Ask the sender for the link for older phones" (never a blank page, never someone else's sample). This replaces the proposal's "always compress with fallback to uncompressed" because the fallback only helps the sender's device, not the guest's.

The hash (not the query string) carries the payload: it is never sent to a server or logged and works on static hosting. Cost: WhatsApp previews cannot be per couple (unchanged from `docs/PLAN.md`).

**D5. What is editable and what is locked, and why.**

| Editable | Why |
|---|---|
| Names (first and full), hosts, the line before the names | The content every couple changes first. |
| Date, time, time zone | Drive the countdown, calendar file and every label. |
| Venue, city, map link, reply-by, WhatsApp and email for replies | Needed for the map, the calendar file and RSVP replies. |
| Four ceremonies: name, date, time, place, what to wear, note (tradition designs) | The schedule. |
| Three story moments: year, title, text | The story section. |
| Invocation and greeting wording (tradition designs only, collapsed) | Families differ; the words are sacred, so they are shown as traditional wording with a caution, never as free decoration. |

| Locked | Why |
|---|---|
| Layout, order, colours, fonts, imagery, motion | The product is locked designs with editable content (research: the pattern for wedding products); free-form editing breaks animated layouts. |
| Section titles and button words ("Kindly reply", "Add to calendar") | They are each design's voice and are checked at 320px. |
| Number of ceremonies and story items | Layouts depend on it (P8). |
| The wedding ceremony's date and time | Single source of truth: "The day". |
| Ceremony ids, the `tradition`, gate and opening behaviour | Designs look up events by id. |

**D6. Where the draft lives.** `localStorage` key `wi-studio-v1`, written 400 ms after the last change and on `pagehide`; every read and write wrapped in `try/catch`; an in-memory fallback when storage is blocked or full (private windows, in-app browsers, quota). Treated as a convenience: the share link is the durable copy, and `#/studio/<id>?d=<payload>` re-imports a link (with confirmation) on another device. Safari may delete script storage after 7 days of non-use (WebKit blog; enforcement uncertain).

## 5. Field table

Source of truth: `src/studio/fields.js` (the table below is generated from it; the plan's Task 1 creates it). 54 keys: 15 single fields, 4 ceremonies x 6, 3 story moments x 3, and 6 wording fields. `#` is the item index 0 to 3 (ceremonies) or 0 to 2 (story). Rules that apply to every field:

- Values are strings. Text is stored as typed (no trimming, no cutting while typing) and tidied when previewed, linked or composed: Unicode NFC, control characters turned into spaces, angle brackets, zero-width space, BOM and bidi override characters removed (ZWJ and ZWNJ kept, Devanagari and Gujarati conjuncts need them), runs of whitespace collapsed, then cut to the limit. Newlines never reach a design: multi-line boxes hold one paragraph.
- Limits count graphemes (`Intl.Segmenter`, code points as the fallback) and are soft: the box accepts more, shows `n/max` from 80 percent of the limit, and the preview and link use the cut text. There is no `maxlength`, which would fight IME composition.
- Required means "if left empty the design's sample value stays". It never produces an empty hole in a layout.
- An empty optional field means "remove it": the design must hide the element (proofing checklist).
- Every input is at least 48px high with a 16px font (iOS does not zoom). The label is visible and tied with `for`/`id`; helper text and errors are tied with `aria-describedby`.
- `autocomplete` is used only for the person's own phone and email; everything else is `off`.

| Key | Path in `invite` | Group and label | Control and attributes | Max | Required | Validation | Helper text | Default (contemporary sample) | Applies to |
|---|---|---|---|---|---|---|---|---|---|
| `ca` | `couple.a` | Names: Name shown first | input text; type=text, autocomplete=off, autocapitalize=words | 30 graphemes | yes | Tidied text, cut at max | First name or nickname, as you want it on the invitation. | "Anaya" | all; common |
| `cb` | `couple.b` | Names: Name shown second | input text; type=text, autocomplete=off, autocapitalize=words | 30 graphemes | yes | Tidied text, cut at max | You can swap the order whenever you like. | "Rohan" | all; common |
| `fa` | `full.a` | Names: Full name, first | input text; type=text, autocomplete=off, autocapitalize=words | 60 graphemes | no | Tidied text, cut at max | Used by designs that print full names. Leave empty to use the first name. | "Anaya Mehra" | all; common |
| `fb` | `full.b` | Names: Full name, second | input text; type=text, autocomplete=off, autocapitalize=words | 60 graphemes | no | Tidied text, cut at max | Leave empty to use the first name. | "Rohan Iyer" | all; common |
| `date` | `date` (calendar part; also `dateLabel`) | The day: Wedding date | input date; type=date, autocomplete=off | n/a | yes | Real calendar date, 2000 to 2100 | The countdown runs to this day and time. | "2027-02-13" | all; common |
| `time` | `date` (clock part; also `timeLabel`) | The day: Wedding time | input time; type=time, autocomplete=off | n/a | yes | HH:MM, 00:00 to 23:59 | When the main ceremony begins. | "17:30" | all; common |
| `tz` | `date` (offset part) | The day: Time zone at the venue | select; type=select, autocomplete=off | n/a | no | One of 13 listed offsets | Guests in other countries still see the venue time. | "+05:30" | all; common |
| `venue` | `venue` | Venue: Venue name | input text; type=text, autocomplete=off | 80 graphemes | yes | Tidied text, cut at max | For example: Saffron Court Gardens. | "Saffron Court Gardens" | all; common |
| `city` | `city` | Venue: City and state | input text; type=text, autocomplete=off | 60 graphemes | yes | Tidied text, cut at max | For example: Udaipur, Rajasthan. | "Udaipur, Rajasthan" | all; common |
| `mapUrl` | `mapUrl` | Venue: Map link (optional) | input url; type=url, inputmode=url, autocomplete=off | 300 characters | no | https on a known map host (Google, Apple, OpenStreetMap), at most 300 characters | Paste a Google Maps or Apple Maps link. Leave empty and we search for the venue and city. | "https://maps.google.com/?q=Udaipur" | all; common |
| `hosts` | `hosts` | Hosts and welcome: Hosted by | textarea 2 rows; type=text, autocomplete=off | 140 graphemes | no | Tidied text, one paragraph, cut at max | Who is inviting. For example: Together with their families. | "Together with their families" | all; common |
| `tagline` | `tagline` | Hosts and welcome: Line before the names | input text; type=text, autocomplete=off | 90 graphemes | no | Tidied text, cut at max | A short welcome line. Wording differs by tradition, so it is kept per tradition. | "are getting married" | all; tradition |
| `rsvpBy` | `rsvpBy` | Replies: Please reply by | input date; type=date, autocomplete=off | n/a | no | Real calendar date, 2000 to 2100 | Optional. Guests see this above the reply form. | "2027-01-15" | all; common |
| `cw` | `contact.whatsapp` | Replies: WhatsApp number for replies | input tel; type=tel, inputmode=tel, autocomplete=tel | 24 characters | no | 8 to 15 digits; a bare 10-digit Indian mobile gets 91 | Include the country code, for example +91 98765 43210. Guests send their reply to this number. | (empty) | all; common |
| `ce` | `contact.email` | Replies: Email for replies | input email; type=email, inputmode=email, autocomplete=email | 100 characters | no | name@host.tld, no ? & , ; : = quotes or spaces | Optional. Guests can also reply by email. | (empty) | all; common |
| `e#n` | `events[i].name` | Ceremonies: Ceremony name | input text; type=text, autocomplete=off | 40 graphemes | yes | Tidied text, cut at max | none | item 1: "Mehendi" | all; tradition |
| `e#o` | `events[i].day` (derived from the offset) | Ceremonies: Date; hidden for the wedding ceremony, which follows The day | input date (stored as day offset); type=date, autocomplete=off | n/a | no | Whole number of days, -60 to 30 | Moves with the wedding date. | item 1: "-2" | all; tradition |
| `e#t` | `events[i].time` (derived) | Ceremonies: Time; hidden for the wedding ceremony, which follows The day | input time; type=time, autocomplete=off | n/a | no | HH:MM, 00:00 to 23:59 | none | item 1: "16:00" | all; tradition |
| `e#p` | `events[i].place` | Ceremonies: Place | input text; type=text, autocomplete=off | 80 graphemes | no | Tidied text, cut at max | none | item 1: "Saffron Court Gardens" | all; tradition |
| `e#d` | `events[i].dress` | Ceremonies: What to wear | input text; type=text, autocomplete=off | 60 graphemes | no | Tidied text, cut at max | For example: Traditional, or Pastels. | item 1: "Greens & yellows" | all; tradition |
| `e#x` | `events[i].note` | Ceremonies: Note for guests | textarea 2 rows; type=text, autocomplete=off | 200 graphemes | no | Tidied text, one paragraph, cut at max | none | item 1: "" | hindu, marwadi, jain; tradition |
| `s#y` | `story[i].year` | Our story: Year | input text; type=text, inputmode=numeric, autocomplete=off | 4 graphemes | no | Four digits, 1900 to 2100 | Four digits. | item 1: "2019" | all; common |
| `s#t` | `story[i].title` | Our story: Title | input text; type=text, autocomplete=off | 50 graphemes | no | Tidied text, cut at max | none | item 1: "A chai, a rainy Tuesday" | all; common |
| `s#x` | `story[i].text` | Our story: What happened | textarea 2 rows; type=text, autocomplete=off | 180 graphemes | no | Tidied text, one paragraph, cut at max | none | item 1: "Two strangers shared one umbrella and a very long conversation." | all; common |
| `ivt` | `invocation.text` | Traditional wording: Words of the invocation, in English letters | input text; type=text, autocomplete=off, lang=en | 80 graphemes | no | Tidied text, cut at max | Traditional wording. Change it only if your family or priest uses different words. | (empty) | hindu, marwadi, jain; tradition |
| `ivs` | `invocation.script` | Traditional wording: The invocation in its own script | input text; type=text, autocomplete=off, lang=hi | 80 graphemes | no | Tidied text, cut at max | Devanagari or Gujarati. Use your phone keyboard. | (empty) | hindu, marwadi, jain; tradition |
| `ivm` | `invocation.meaning` | Traditional wording: What the invocation means | textarea 2 rows; type=text, autocomplete=off, lang=en | 160 graphemes | no | Tidied text, one paragraph, cut at max | none | (empty) | hindu, marwadi, jain; tradition |
| `grt` | `greeting.text` | Traditional wording: Words of the greeting, in English letters | input text; type=text, autocomplete=off, lang=en | 80 graphemes | no | Tidied text, cut at max | Traditional wording. Change it only if your family or priest uses different words. | (empty) | hindu, marwadi, jain; tradition |
| `grs` | `greeting.script` | Traditional wording: The greeting in its own script | input text; type=text, autocomplete=off, lang=hi | 80 graphemes | no | Tidied text, cut at max | Devanagari or Gujarati. Use your phone keyboard. | (empty) | hindu, marwadi, jain; tradition |
| `grm` | `greeting.meaning` | Traditional wording: What the greeting means | textarea 2 rows; type=text, autocomplete=off, lang=en | 160 graphemes | no | Tidied text, one paragraph, cut at max | none | (empty) | hindu, marwadi, jain; tradition |


Derived values (not typed, produced by `compose`): `invite.date` (`<date>T<time>:00<offset>`), `dateLabel` (`Saturday, 13 February 2027`), `timeLabel` (`5:30 PM`), `rsvpBy` (`15 January 2027`), each event's `day` (`11 Feb 2027`) and `time`, `full.a` and `full.b` (the first name when no full name is given, or when the first name was changed and the sample's full name no longer applies), `mapUrl` (a Google Maps search for venue and city when no link is pasted and the venue or city was edited), `contact` (only when a number or email exists; a bare 10-digit Indian mobile gets the 91 prefix). A ceremony held at the venue in the sample (Mehendi and Wedding in the contemporary sample) follows the venue name when it is edited.

Time zone options (fixed offsets, DST named): India +05:30, Gulf +04:00, Nepal +05:45, Bangladesh +06:00, Singapore and Hong Kong +08:00, Sydney and Melbourne +10:00, London winter +00:00, London summer and Central Europe winter +01:00, New York winter -05:00 and summer -04:00, Chicago winter -06:00, California winter -08:00 and summer -07:00. Labels are never converted: a guest abroad reads the venue's time as written, and the countdown runs to the exact instant.

## 6. Draft model, versioning and migration

Three shapes, all plain JSON of strings:

- **Overrides** (what `compose` and the link use): `{ ca: 'Meera', e0n: 'Haldi', ... }`, flat, only edited fields, keys from the field table.
- **Draft** (what is stored): `{ v: 1, common: { ... }, trad: { hindu: { ... }, jain: { ... } } }`. `mergedFor(draft, tradition)` returns the overrides for one design family.
- **Link envelope**: `{ "v": 1, "f": { ...overrides for that design } }`, prefixed `j.` (plain) or `z.` (deflate-raw), base64url without padding.

Rules:

1. **Adding a field is not a version bump.** Old links lack the key (the preset shows), old decoders ignore unknown keys.
2. **Renaming, removing or changing the meaning of a key is a bump** with a migration step in `MIGRATIONS` (`codec.js`): one function per version that returns the envelope at version + 1. The decoder applies steps until it reaches the current version, then runs `cleanOverrides`. A newer version than the code knows gives a friendly "made with a newer version" page, never a guess.
3. **Golden links.** Every released payload version keeps a fixed link in `tests/studio/codec.test.js` that must keep decoding (the plan adds the version 1 golden link).
4. **Drafts are a cache.** `parseDraft` returns an empty draft for corrupt, foreign or newer storage; the person can re-import their link.
5. **Preset edits change old links.** A link holds only edits, so a field the sender did not touch shows the preset's current default. Preset changes are limited to corrections from community reviewers, listed in the changelog (risk R6). Date, time, names, venue and city are always warned about before sharing if untouched, so they are normally in the link.
6. **Link validity is permanent.** A sent link keeps its details; editing makes a new link (the share sheet says so in one line).

Storage key: `wi-studio-v1`. Draft reads and writes are wrapped in `try/catch`; `window.localStorage` itself is accessed inside the guard because blocked storage throws on access.

## 7. Studio UI design direction

Made with the frontend-design guidance. Process: brainstorm, review against the brief, revise, then build.

### 7.1 Subject, audience, job

- Subject: preparing a real wedding invitation (a kankotri) to send on WhatsApp.
- Audience: a couple, or the relative who "does the computer work", usually on a mid-range Android phone, typing in English, Hindi or Gujarati, nervous about a wrong name or date.
- Primary job: put the right details in, see that the invitation is right, send it with confidence.
- Tone: calm, warm, tactile; the opposite of a dashboard. It should feel like checking a proof from the printer, not filling in a form.

### 7.2 Concept: the proof table

A printer sends a proof before the print run and the family checks every name. The Studio is that table: the invitation lies on a cool grey-blue desk under crop marks at its real size ("Phone, 390 by 844"), and the order sheet (the form) is warm white paper beside it. The live phone preview is the hero and the one memorable element; everything else is quiet and ruled. Fields you have changed carry a dashed haldi stitch on their left edge, the way a tailor marks fitted cloth; the group headers say "Sample" or "2 edited".

### 7.3 Compact token system

Colour (named hex, contrast measured against the colour it sits on):

| Name | Hex | Role | Contrast |
|---|---|---|---|
| Desk | `#DDE3EA` | page ground, with a 24px cutting-mat grid at 6 percent | ink on desk 12.3:1 |
| Sheet | `#FFFEFB` | the form, top bar, dialogs | ink on sheet 15.7:1 |
| Ink | `#1D2230` | text, the selected tab and segment | white on ink 15.9:1 |
| Soft ink | `#4A5163` | helper text, counters | 7.9:1 on sheet, 6.1:1 on desk |
| Peacock | `#0E6B70` | actions, focus ring, "edited" count, saved bead | 6.2:1 on sheet, white on peacock 6.3:1 |
| Kumkum | `#B3261E` | errors, "still the sample" warning, not-saved bead | 6.5:1 on sheet |
| Haldi | `#F0B429` | the edited-field stitch and "saving" bead; never text | 1.8:1, decorative only |
| Edge | `#7A8496` | control borders | 3.7:1 on sheet (WCAG 1.4.11 asks 3:1) |
| Line | `#CCD3DC` | dividers only | decorative |

Type: Gloock (already loaded for the gallery) for the title and dialog headings only, 22 to 26px. Hanken Grotesk for everything else, with Mukta and Noto Serif Gujarati as fallbacks so typed Devanagari and Gujarati render. Scale: 16 (inputs, body), 15 (labels, 600), 14 (helper, status), 13 (counters), 17 (group names, 600). Line height 1.5 body, 1.4 helper; helper and lede lines capped near 46 characters.

Spacing: 4px base: 4, 8, 12, 16, 20, 24, 32, 48. Rows 48 to 56px; every control at least 44px.

Radius, chosen by what the thing is: paper 6px (fieldsets, dialogs), controls 10px (inputs), buttons and segmented tabs fully round, the phone frame 44px (8px for the desktop frame).

Motion: 160ms for chevrons and the tab bar stepping aside while typing; 480ms, once, for the phone being laid on the desk when the Studio opens (translate 14px and a 0.8 degree rotation). Nothing loops. Under `prefers-reduced-motion: reduce` all of it is off.

### 7.4 Layout concept

Desktop (1366 by 768): sheet 380 to 460px on the left, desk on the right.

```text
+---------------------------------------------------------------------------------+
| All designs   Rajmahal      o Saved on this device                   [ Share ]  |
+--------------------------------+------------------------------------------------+
| Change what you like. The      |                                                |
| preview updates as you type.   |       +-  -  -  -  -  -  -  -  -  -  +         |
|--------------------------------|                                                |
| Names                   Sample |       .------------------------.               |
|--------------------------------|       |   the real invitation  |               |
| The day               2 edited |       |   (gate, then page)    |               |
|   : Wedding date               |       |   iframe 390 x 844,    |               |
|   : [ 18 Apr 2027           ]  |       |   scaled to fit        |               |
|   : Wedding time               |       '------------------------'               |
|   : [ 9:15 AM               ]  |                                                |
|     Time zone [ India  v ]     |       +-  -  -  -  -  -  -  -  -  -  +         |
|--------------------------------|        Phone, 390 by 844                       |
| Venue                   Sample |                                                |
| Hosts and welcome       Sample | ( Phone | Small phone | Desktop )              |
| Ceremonies              Sample |        [ Replay opening ]                      |
| Our story               Sample |                                                |
| Replies                 Sample |                                                |
| [ Start over with the sample ] |                                                |
+--------------------------------+------------------------------------------------+
```

In the desktop wireframe, `:` marks the dashed haldi stitch on a field you have changed.

Phone (390 by 844), Edit tab, then Preview tab. The preview fills the panel with no frame (it is the real viewport), the tab bar sits under the thumb.

```text
 Edit tab                  Preview tab               Share (bottom sheet)
+------------------------+ +------------------------+ +------------------------+
| All designs  Rajmahal  | | All designs  Rajmahal  | | Send your invitation   |
| o Saved on this device | | o Saved on this device | | This link opens the... |
|------------------------| |                        | | +- Still the sample -+ |
| Change what you like.. | |                        | | | Hosts, Places ...  | |
| Names           Sample | |                        | | | [Go back, change]  | |
| The day       2 edited | |   the invitation,      | | +--------------------+ |
|   Wedding date         | |   full width, real     | | Guest name (optional)  |
|   [ 18 Apr 2027      ] | |   viewport, gate and   | | Invitation link        |
|   Wedding time         | |   page, tappable       | | [..................]   |
|   [ 9:15 AM          ] | |                        | | [Copy link][WhatsApp]  |
| Venue           Sample | |                        | | [Open as a guest]      |
|------------------------| |                        | | Link for older phones >|
|(Edit | Preview)  Share | |(Edit | Preview)[Replay]| | Close                  |
+------------------------+ +------------------------+ +------------------------+
```

Alignment: everything left-aligned (forms read as a column); the preview is centred on the desk; the bar is a three-part row (back, title and status, action).

### 7.5 What makes it distinctive, and what it deliberately is not

- The invitation is the interface. The preview is the real app at a real viewport on a desk with crop marks and its size printed under it; there is no mock device chrome, no illustration, no stock photo.
- The edit state is a dashed stitch, not a coloured card or a badge. "Sample" versus "2 edited" on each group header answers "what have I done so far" without a progress bar.
- Only one place carries motion and shadow: the phone. The form is flat ruled paper.
- The words come from the job: "Name shown first", "Hosted by", "Start over with the sample", "Still the sample", "Link for older phones". No product jargon (no "draft", "payload", "publish").

Critique of this direction against the generic-AI list (checked before building; "changed" marks what the critique altered):

| Generic default | Risk in this direction | Verdict |
|---|---|---|
| Warm cream ground, high-contrast serif, terracotta or maroon accent | It was the first instinct, because the subject is a wedding and the gallery designs are warm | Changed: cool grey-blue desk plus a warm white sheet, peacock for actions, kumkum only for attention. The serif is used for titles only. |
| Near-black ground with one acid accent | None | The gallery is dark; the Studio is deliberately light so it can be read and typed on in daylight on a phone. |
| Broadsheet look: hairlines, zero radius, dense columns | Ruled rows could drift that way | Hairlines only between groups; fields are spaced, not ruled; radii are 6, 10 and full; one column of generous rows. |
| SaaS card kit: identical rounded cards, one radius, the same soft shadow, gradient washes | Eight groups invite eight cards | Groups are ruled accordion rows, not cards. Only ceremony fieldsets and the share warning are boxed (1px, 6px radius). The only shadow is the phone's. No gradients. |
| Template chrome: tracked all-caps eyebrows, dot-joined meta strings, spaced em dashes, monospace labels, arrows on links | A size caption is the likeliest place | Caption is "Phone, 390 by 844", sentence case, Hanken Grotesk. No arrows, no monospace, no eyebrows. |
| Numbered steps (01, 02, 03) | A wizard was considered | Not a sequence: the groups are independent, so no numbering. |
| Thick one-sided accent border on a card | The share warning was built with a 3px kumkum left bar and an automated design check flagged it | Changed: a full 1px kumkum border with a tint. The dashed haldi stitch on edited fields is kept on purpose: a thin dashed mark on a field, not a card edge, and the product's one signature. Revisit if testing shows people read it as a validation state. |
| Mock phone with a notch and buttons | Device mock-ups are the stock way to show a phone preview | Not used: the bezel is a plain dark rounded rectangle with crop marks and a size caption, because the content is a real invitation at a real viewport. |

Open design risk: the cutting-mat grid can read as a blueprint cliche; if so, drop the grid and keep the flat desk colour (one CSS line).

### 7.6 Copy deck (microcopy, sentence case, same word for the same action)

| Where | Text |
|---|---|
| Studio lede | Change what you like. The preview updates as you type, and everything is saved on this device. |
| Save state | Saved on this device; Saving...; Not saved on this device. The share link still holds everything. |
| Group state | Sample; 3 edited |
| Start over | Button: Start over with the sample. Dialog: "Start over with the sample?" "Your names, dates and wording on this device go back to the sample. You can undo this for a few seconds." Buttons: Start over, Keep my changes. Toast: "Back to the sample." Undo |
| Share title and lede | Send your invitation. This link opens the invitation with your details. Free, no account, nothing stored on a server. |
| Sample warning | Still the sample. Guests will see these as written in the sample: Names, Venue and city. Button: Go back and change them |
| Link actions | Copy link, Send on WhatsApp, More options, Open as a guest. Result: Link copied. If clipboard is blocked: Press and hold the link, then choose Copy. |
| Fine print | If you change something later, copy the link again. Links you already sent keep the old details. Anyone with the link can see the details in it. |
| Values that cannot be used | Check before sending. "These cannot be used as typed, so the sample or a shorter version will show: Map link (optional)." Button: Go back and fix them |
| Older phones | Link for older phones. Phones from before 2023 may not open the short link. This one is longer but opens everywhere. Button: Copy long link |
| Errors (on blur, text, tied to the field) | "Name shown first is needed." "Shorten this to 30 characters or fewer. Anything longer is cut off." "Enter a real date between 2000 and 2100." "Enter a time, for example 5:30 PM." "Use a Google Maps or Apple Maps link that starts with https://." "Enter 8 to 15 digits, starting with the country code." "Enter an email like name@example.com." "Enter a four-digit year, for example 2019." |
| Guest link broken | "This invitation link did not open." "The link looks damaged or incomplete. Ask the sender to send it again." Variants: needs a newer phone (ask for the link for older phones); newer version of the studio. Button: See the designs |
| Not yet editable | "<Design> is not ready for editing yet." "We are checking each design with long names, short names and unusual details before opening it. These are ready now:" then links. |
| Link offered in the Studio | "This link carries someone's details. Use them here?" Buttons: Use these details, Keep mine |

### 7.7 Behaviour details

- First visit: the first group (Names) is open, decided once on mount so typing never closes the group the person is in (a bug the prototype caught). Groups are native `<details>` sharing one `name`, so opening one closes the others (on every screen size).
- Focusing a sample value selects it, so typing replaces it. Focusing an edited value places the caret as usual.
- Focusing a field scrolls the preview to the related section if the design marks `data-studio-section` (hero, events, story, venue, replies). Designs without markers ignore the message.
- Preview updates 120 ms after the last change. Replay opening closes the gate again; it never reloads the frame.
- Device toggle (desktop only): Phone 390 by 844, Small phone 320 by 568, Desktop 1280 by 800, scaled with `transform` to fit; the iframe keeps its true size so media queries are right.
- "Open as a guest" opens the real link in a new tab (gate included) for a final check on the person's own phone.
- Start over is disabled when nothing was changed; after it, an undo toast shows for 8 seconds.

## 8. Embed protocol (parent Studio and child preview)

The preview is the same app at `#/t/<id>?embed=1` in an `<iframe>` on the same origin. In embed mode the app hides the floating bar, ignores Escape, does not change `document.title`, and renders a blank screen in the design's ground colour until the first draft arrives (never the sample), then falls back to "no overrides" after 1.5 seconds if no parent answers.

Every message is `{ ns: 'wi-studio', v: 1, type, ... }`.

| Direction | type | Payload | Meaning |
|---|---|---|---|
| child to parent | `ready` | none | The child's listener is attached. Sent on every mount of the embed hook (first load, iframe reload). |
| parent to child | `draft` | `{ seq: int >= 0, overrides: { key: string } }` | The whole flat override map. The child ignores a `seq` lower than the last one. |
| child to parent | `applied` | `{ seq }` | The draft with that `seq` was committed by React (used by tests; not shown to the person). |
| parent to child | `replay` | none | Close the gate again (same code path as the Replay button; the frame is not reloaded). |
| parent to child | `scroll` | `{ section: /^[a-z-]{1,20}$/ }` | Scroll `[data-studio-section="<section>"]` into view (smooth unless reduced motion). |

Handshake and updates:

1. The parent mounts the iframe and attaches its listener first.
2. The child attaches its listener, then posts `ready` to `window.parent` with `targetOrigin = location.origin`.
3. On `ready` the parent marks the frame ready and posts the current draft.
4. After that the parent posts a new `draft` 120 ms after the overrides object changes, skipping a repeat of the same object. Nothing is sent before `ready`.
5. If the iframe reloads, the child posts `ready` again and the parent resends the draft.

Checks, on both sides, before anything is used:

- `event.origin === location.origin` and `event.source === <expected window>` (child: `window.parent`; parent: the iframe's `contentWindow`). Never `*` as a target origin.
- `event.data` is an object with `ns === 'wi-studio'` and `v === 1`, a known `type`, an integer `seq`, at most 80 keys in `overrides`, a `section` matching the pattern. Anything else is dropped without a response.
- The child passes `overrides` through the same `cleanOverrides` as a share link. A parent (or anything that gets itself accepted) can only supply whitelisted, tidied strings.

No-replay update rule: a draft only changes the `invite` prop of the page and gate that are already mounted. The gate sequence state (`closed`, `opening`, `open`) lives in the design component and is not touched by a draft, so typing never closes the gate again. Only `replay` (or the person tapping the gate) changes it.

Focus rule (child): until the person presses or taps in the preview, calls to `element.focus()` are ignored; for 4 seconds after a press they work as normal (this covers the page handing focus to its heading when the gate has opened). Without it each gate's `autoFocus` moves keyboard focus into the iframe, also while someone is typing in the form (measured: the prototype lost focus on load, and the form's first group closed).

Cost and limits: the iframe loads the app a second time; JS, CSS and fonts come from cache. Not tested: Safari on iOS inside the WhatsApp in-app browser (open risk R7).

## 9. Security rules

The Studio turns text from three untrusted places (a person typing, a link, a saved draft) and one semi-trusted place (a parent window) into a page other people open. Rules, each with where it is enforced:

| # | Rule | Enforced in |
|---|---|---|
| S1 | User text is rendered only as React text nodes. No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` or HTML string building anywhere in the Studio or in a proofed design. | Review checklist; lint stays on; harness `hostile` case checks no injected `img` or script runs. |
| S2 | One sanitiser, used everywhere: `cleanOverrides` runs on typed drafts, decoded links, saved drafts and `postMessage` input. `compose` runs it again, so a design never receives raw input. | `sanitise.js`, `compose.js`; unit tests. |
| S3 | Whitelist copy, never merge. The sanitiser iterates the field table and reads `raw[key]` with `Object.hasOwn`; it never iterates the input's own keys and builds a new object. `__proto__`, `constructor` and unknown keys are ignored. | Unit test with a `JSON.parse` payload containing `__proto__`; harness checks `({}).polluted` is undefined. |
| S4 | Size caps before and during decoding: hash value at most 12,000 characters; decoded JSON at most 16 KiB, enforced while the decompression stream is read (a bomb is cancelled, not buffered); at most 80 keys in a message; every string cut to its field limit. | `codec.js`, `protocol.js`; unit test with an 8 MiB zero-filled bomb (stopped, small enough to be sent); harness bomb case finishes under 5 seconds. |
| S5 | URLs: the map link must parse with `new URL`, be `https:`, carry no username or password, and match an allowed host and path prefix (Google Maps and short links, Apple Maps, OpenStreetMap). `javascript:`, `data:`, `http:`, look-alike hosts (`maps.google.com.evil.example`) and other paths are rejected. WhatsApp links are built from digits only. `mailto:` uses a validated address that cannot contain `? & , ; : =`, quotes or spaces, so a link cannot add `?bcc=`. External links keep `rel="noreferrer"`. | `normaliseUrl`, `emailOk`, `waNumber`; unit and harness tests. |
| S6 | Dates are never parsed from date-only strings (`new Date('2027-02-14')` is UTC midnight and shifts a day in US time zones). Labels come from the calendar parts the person typed; the ISO date carries an explicit offset; an invalid date leaves the sample's value. | `format.js`, `compose.js`; unit tests, including a leap-year and a month-end case. |
| S7 | `postMessage`: exact `targetOrigin` (never `*`), `event.origin` and `event.source` checks on both sides, shape validation after the checks. A sandbox is not used because `allow-scripts allow-same-origin` on same-origin content gives no protection (MDN). | `protocol.js`; harness `hostile` frames the preview from `http://evil.test` and posts a draft: it must not apply. |
| S8 | No new network endpoint. The Studio makes no requests. Links use endpoints the app already uses (`wa.me`, the browser's own share sheet, the Google Calendar template link in `ics.js`). Map links are followed by the guest, never fetched by the app. | Review. Matches the MathCo rule not to call endpoints that IT has not approved. |
| S9 | A link that cannot be read never falls back to a sample: the guest sees "This invitation link did not open". | `App.jsx`; harness checks that no sample couple name appears. |
| S10 | Privacy: names, venues, phone numbers and emails exist only in the person's browser and in the URL hash they share. The hash is not sent in HTTP requests. The share sheet says "Anyone with the link can see the details in it." | Share sheet copy. |
| S11 | Sample content stays fictional (the existing footer says so). The Studio stores nothing at MathCo. Real couples' details must not be pasted into demos or tickets. MathCo's Data Classification Policy applies to anything delivered to a client; delivery to a client goes through legal and compliance review as in `docs/PLAN.md`. This spec gives no legal advice. | Process, not code. |

## 10. Accessibility

- **Labels and help.** Every control has a visible label tied with `for` and `id` (WCAG 3.3.2). Helper text and errors are tied with `aria-describedby`. Placeholders are not labels.
- **Errors.** Text, not colour alone (3.3.1), with the fix in the sentence (3.3.3). Shown on blur, then updated on every keystroke; never on focus. `aria-invalid` on the control. No focus jump: the Share button is never disabled, and the share sheet lists what needs checking.
- **Keyboard.** Native controls only: `<details>`, radio groups for the device and tab switches, `<dialog>` with `showModal()` (focus trap, Escape closes, focus returns to the opener). Focus ring: 3px peacock with 2px offset on every control. Not a `<form>`, so Enter in a field never submits or triggers anything while a keyboard (IME) candidate is being confirmed.
- **Announcements.** Save state, copy result and undo toast are `role="status"` (polite). A guest link that cannot open is `role="alert"`. The preview iframe has a title. Counters and the preview's updates are not live regions (they would announce on every keystroke).
- **Targets and text.** Fields 48px high, buttons and tabs 44px or more (WCAG 2.5.8 asks 24px, 2.5.5 AAA asks 44px); input font 16px or more; text 14px or more except counters (13px). Tested at 390 wide by the harness.
- **Motion.** The lay-down, chevron and tab-bar movement are off under `prefers-reduced-motion: reduce` (harness asserts `animation-name: none`). The preview's design keeps its own reduced-motion behaviour.
- **Scripts and language.** Wording fields carry `lang` (`hi` for the native script, `en` for transliteration and meaning); the body font stack falls back to Mukta and Noto Serif Gujarati.
- **Zoom.** The viewport meta is unchanged (no `maximum-scale`).
- **Hidden panels.** On a phone, the panel not shown is `inert`: the preview stays laid out at full size (its designs measure themselves on mount) but is invisible and not focusable.
- **Colour.** Contrast figures are in section 7.3. The haldi stitch is decorative; the same information ("Sample", "3 edited") is in text.
- **Not covered by automation, test by hand:** VoiceOver and TalkBack reading order of a long form; Gboard Hindi and Gujarati input and transliteration (no characters dropped, no caret jumps); iOS Safari date and time inputs on a real iPhone.

## 11. Where the Studio touches shared code

| File | Change | Why |
|---|---|---|
| `src/App.jsx` | Router for gallery, design and Studio; viewer reads content from `useInviteSource`; gallery and bar moved out | P3, P4, E6 |
| `src/lib/hooks.js` | `useRoute()` returns `{ view, id, params }`; `useCountdown` recomputes from `iso` and never prints `NaN` | E3, E6 |
| `src/components/Pill.jsx` (new) | The floating bar, with browse and guest variants, Customize, data-preserving share URL | P4, P5, E5 |
| `src/gallery/Gallery.jsx` (new) | The gallery, with Customize on cards | P1 |
| `src/gallery.css` | Card actions, bar additions, `.sr-only`, link-problem page | P1, P5 |
| `src/data/templates.js` | `editable` flag, set per design | P6 |
| `src/data/presets.js` (new) | One lookup for the four sample objects | P2 |
| The 25 designs | Unchanged until proofed (section 12) | |

## 12. Pilot plan: Rajmahal, and what "editable-proof" means

### 12.1 The checklist (every design must pass before `editable: true`)

1. **Keys.** No React `key` is built from editable text (`s.year + s.title`, `e.name`). Use the index or a preset id. (E4: 24 of 25 designs use `key={s.year…}`.)
2. **Observers and reveal state.** Anything that observes elements or measures on mount (`useReveal`, `IntersectionObserver`, `ResizeObserver`) keeps working when text inside the observed element changes, and an item that has already revealed stays revealed.
3. **State initialisers.** No `useState(() => f(invite))`, `useMemo` or `useRef` caches a value derived from `invite` without being keyed on it. (Rajmahal: only `open`, from `viaGate`, which is correct.)
4. **Long text.** At the field limits (names 30, full names 60, hosts 140, line before names 90, venue 80, city 60, ceremony name 40, place 80, dress 60, note 200, story title 50 and text 180): no sideways scroll at 320px, no text outside its container, no text under 12px, in the gate and the page. Use `fitStep()` and `data-fit` steps, `overflow-wrap: anywhere` and `text-wrap: balance`; never silently cut the person's words.
5. **Short text and letter splitting.** A one-letter name, a one-letter venue and a two-letter ceremony look intentional. Monograms use `firstGrapheme()`, never `name[0]`; per-letter animations (Marigold Mela's `Letters`, Boarding Pass's flaps) split with `graphemes()`, never `[...text]` (E10).
6. **Missing optional fields.** Hosts, line before names, map link, reply-by, dress, note and contact can be empty: the element is not rendered, no empty margin box is left, no "undefined", "null" or "NaN" is printed.
7. **Special characters.** Apostrophes, quotes, ampersand, emoji, Devanagari and Gujarati render (font stacks fall back to Noto), nothing is double-escaped (`&amp;` shows literally).
8. **Dates.** Every date or time on the page and gate comes from `invite.dateLabel`, `timeLabel`, event `day` and `time`, and the countdown from `invite.date`. A past date shows zeros; a date in 2090 (five-digit day counts) fits its boxes.
9. **Gate.** The gate shows the edited names and date; at the field limits every line of its text stays on screen and clear of its button, from 320px up (the harness measures line boxes, not element boxes); the button label stays the design's own.
10. **Counts and ids.** Anything that indexes `events[n]` or `story[n]` is correct for exactly 4 and 3; lookups use the event `id` (`wedding`).
11. **Anchors.** `data-studio-section` on the hero, events, story, venue and replies containers (optional; missing ones are ignored).
12. **No stale state.** Editing in the Studio changes the open page in place: no gate replay, no remount flash, reveal states preserved.
13. **Gates still pass.** `npm run qa` for the design, and the existing in-page `.tpl` text and target-size rules.
14. **Proof run.** `node scripts/qa-studio.mjs --only=edit-live,proof --design=<id>` passes (every fixture in `scripts/fixtures/studio-cases.mjs` at 320, 360, 390 and 1366 wide). Then, in the same commit, set `editable: true` in `src/data/templates.js`.

### 12.2 Rajmahal: findings and changes (prototype)

Before (original `Rajmahal.jsx`): story `key={s.year + s.title}` (line 180) and event `key={e.id || e.name}` (156); `hosts` (96), `tagline` (102), `city` (109 and 192), the "Wear" row (165) and the map button (195) rendered unconditionally; font stack `'Cormorant Garamond', Georgia` with no Devanagari or Gujarati fallback; long unbroken words not wrapped; hero text in a fixed-aspect arch with a `clip-path`, so overflow is silently cut.

Changes (all in `src/templates/rajmahal/`: in `Rajmahal.jsx` 6 conditionals, 2 key changes, 5 section anchors and 4 `data-fit` attributes; in `rajmahal.css` 15 added lines; in `Gate.jsx` and `gate.css` one `data-fit` attribute and 2 CSS rules; the diff is +23 and -18 lines in `Rajmahal.jsx`, +15 and -2 in `rajmahal.css`, +3 in `Gate.jsx`, +2 in `gate.css`):

- Index keys for events and story.
- `invite.hosts &&`, `invite.tagline &&`, `invite.city &&` (both places), `e.dress &&`, `invite.mapUrl &&`.
- `fitStep()` sets `data-fit` on the names (thresholds 10 and 16 graphemes), hosts (60 and 100), line before names (50 and 80) and venue line (40 and 70); CSS steps the type down to a floor of 12px.
- Font stack adds `'Noto Serif Devanagari', 'Noto Serif Gujarati'`; the root gets `overflow-wrap: anywhere`; hosts, tagline and venue heading get `text-wrap: balance`; the venue's city line uses `max(12px, 0.9em)`.
- `data-studio-section` on hero, events, story, venue and replies.
- The gate's nameplate gets the same treatment: `data-fit` from the two names (10 and 16 graphemes), type capped at 36px and then 24px.
- Shared: `useCountdown` fix (E3).

Verified in the prototype with `scripts/qa-studio.mjs --only=proof --design=rajmahal`: nine fixtures (every field at maximum, Latin and Devanagari; shortest possible; optional fields emptied; special characters and emoji; one very long unbroken word; far-future date; past date; midnight in a far time zone) at four widths, plus a live edit run (date moved to 2090 and to 2020, a story title edited after its plaque had revealed). Failures found and fixed on the way: hero overflow of 16px at 320 with maximum Devanagari; a 10.8px text node from `0.9em` of a 12px line; a story plaque left invisible after its key changed (the check fails against the original key, see section 13); and, after a screenshot showed it, the closed gate's nameplate running into its own button and off the screen with maximum-length names, which the first version of the harness (horizontal overflow only) had missed, so it now measures gate line boxes against the button and the viewport.

### 12.3 Order after Rajmahal

Measured on the prototype before any other design was touched: the `edit-live` area, run through `?qa=1` on all 25 designs, passes for every one. In each, typing a name changes the gate, the opened page changes in place within 1.2 seconds without the gate coming back and without the page element being replaced, a date edit shows, and the console stays free of errors (including React key warnings). The Studio therefore works with all 25 designs as they are; what the checklist adds is correctness at the edges (length, emptiness, characters, keys, reveal state). One real finding from that run: Marigold Mela sets each name letter by letter from `[...text]`, so its text has a line break between letters (the harness had to ignore whitespace) and a Devanagari name would be split into pieces that render apart; checklist item 5 covers it.

Suggested order, easiest first (inference from reading the code, not measured): Gopuram, Editorial, Marigold Mela, Botanical, Gatsby Deco, Boho Sun, Celestial, Storybook, then Boarding Pass (split-flap cells pad event names to 9 characters, flaps built per character), then the 15 tradition designs. The scroll-driven or mechanism-driven ones (Haveli Fresco, Kathputli Stage, Ratnatraya Prism, Matsyayugala, Panch Rang Dhvaj, Ranakpur Hall, Baori Descent, Vijnapti Patra, Vastu Mandala, Gold Mantapa, Lagnachauk) need extra care with counts and geometry. Tradition designs also need a community reader for wording changes (README). Effort per design is not estimated: Rajmahal's changes are small, but that is one data point.

## 13. Test plan

Unit (`node --test`, no new dependency; pure functions only): `format`, `fields`, `sanitise`, `compose`, `codec`, `store`, `protocol`, `route`, `countdown`, `fit`, `embedFocus`. 75 tests in the prototype. Key invariants:

- For each of the four presets, `compose(preset, {})` deep-equals the preset, and `compose(preset, presetValues(preset))` does too: deriving labels reproduces every existing string.
- Each preset has exactly 4 events and 3 story items, unique event ids, one `wedding` event on the wedding day at the countdown time, and every value inside its own field limit.
- Hostile input: `__proto__`, arrays, numbers, `javascript:` links, look-alike hosts, header-injection emails, angle brackets, bidi overrides, NUL, 200-character names, impossible dates.
- Codec: round trips in English and Devanagari, plain and compressed, size ceilings (English under 900, Devanagari under 1,200), golden v1 link, migration chain, bomb, truncated and non-UTF-8 data, no-`CompressionStream` behaviour.
- Storage: scope split, raw text kept, hostile stored values tidied, blocked and full storage never throw.
- Protocol: origin, source, shape, key-count and section-pattern rejections; `send` never throws.

Browser (`node scripts/qa-studio.mjs`, Playwright core with Edge or Chrome, like `scripts/qa-gate.mjs`; areas can be run alone with `--only=`):

| Area | What it proves |
|---|---|
| `edit-live` (all 25 designs through `?qa=1`) | Typing a name shows in the gate and the opened page; editing again changes the page in place within 1.2 s, the gate does not come back and the page element is the same node (not rebuilt); a date edit shows; no page or console errors (React key warnings are console errors). |
| `share` | A link made in the Studio opens the same invitation in a fresh browser profile (names, title, no gallery bar); link length stays under 1,400; the sample warning appears; a plain link opens with `CompressionStream` removed; a compressed link in that browser shows the explanation. Run for Rajmahal and one tradition design. |
| `hostile` | Markup, `javascript:` map link, prototype key, header-injection email, oversized payload, bomb, bad base64, unknown prefix, truncated data, future version, array fields: no script runs, no `javascript:` link reaches the page, bad links show the error page within 5 seconds and never a sample couple. A page on another origin that frames the preview cannot change it (the check fails if the frame did not load, so it cannot pass vacuously). |
| `storage` | Quota error and blocked storage: the Studio still works, says "Not saved", and Share still produces a link. Reload restores a saved draft; Start over resets; Undo restores. |
| `gallery` | 25 cards, each with Customize (editable designs) or "Editing soon"; card actions 44px or more; no sideways scroll; the floating bar fits a 320px screen with every control 44px or more; a guest link gets the small bar (no gallery navigation) whose share link keeps `?d=`. |
| `mobile` (390 by 844, touch) | Starts on Edit with the preview invisible; the tab bar steps aside while a field has focus and returns on blur; Preview shows the edit at full width; edits survive tab switches; no sideways scroll; fields 16px or more; controls 44px or more. |
| `focus` | The preview never keeps keyboard focus after load or Replay; reduced motion removes the lay-down. |
| `proof` (one design, nine fixtures, four widths, plus live edits) | Section 12.1 items 4 to 9, 12: no overflow, gate text clear of its button and on screen, hero text inside its container, no text under 12px, no empty elements, no `undefined`, `NaN`, `null` or `[object` text, countdown zeros for a past date, digits fit, plaque stays visible after its text changes. |

Mutation checks (done on the prototype, each one breaks a single thing, rebuilds, and expects the named area to fail; repeat when the code changes):

| Change | Expected failure | Result on the prototype |
|---|---|---|
| Story key built from the text again (`key={s.year + s.title}`) | `proof`: "story plaque is invisible after its text changed" | caught |
| `event.origin` check removed from `accept` | `hostile`: "a cross-origin parent could change the preview", and the protocol unit test | caught |
| `event.source` check removed from `accept` | protocol unit test | caught |
| Focus guard removed from `useEmbedOverrides` | `focus`: "the preview kept keyboard focus" | caught |
| First group closes when the draft becomes edited (`openFirst={!draft.edited}`) | `mobile` | caught |
| A new draft makes the viewer replay the gate | `edit-live`: "the opening gate replayed while editing" | caught |
| The page remounted on every draft (`key` on the page) | `edit-live`: "the page was rebuilt instead of updated in place" | caught |
| `normaliseUrl` accepts any URL | `hostile` ("a javascript: link reached the page") and three unit tests | caught |
| The bar's share URL drops `d` | `gallery`: "the share link in the bar drops the personalised data" | caught |
| The gate's `data-fit` removed | `proof`: "lines of gate text overlap the open button" | caught |

Two harness defects were found this way and fixed: the cross-origin check first passed without proving anything (Chromium's local-network checks stopped the framed preview from loading), so it now fails when the frame did not load and runs in a browser started with those checks switched off; and the first "gate replayed" mutation (a key on the gate) was invisible because a gate that is already open is unmounted, so the check now also asserts that the page element itself survives an edit.

Manual device pass before announcing the feature (cannot be automated here): iPhone Safari 16.4 or later and 16.3 or earlier (date and time inputs, 16px zoom, `deflate-raw` absence); Android Chrome with Gboard Hindi and Gujarati (typing, transliteration, no dropped characters, no caret jumps); the WhatsApp and Instagram in-app browsers on both OSes (link opens, clipboard, share); a low-memory Android phone with the Studio's two app instances; Samsung Internet; a real link sent through WhatsApp and opened by someone else.

Commands: `npm test`, `npm run lint`, `npm run build`, `npm run preview` in one terminal and `npm run qa:studio` (all areas) or `npm run qa` (the existing gate suite) in another.

## 14. Task breakdown and file ownership

Ten tasks; file lists are disjoint, so tasks with no dependency between them can be done by different people or agents without conflicts. The plan has the full steps.

| Task | Deliverable | Owns (create or modify) | Depends on |
|---|---|---|---|
| 1 | Schema, presets, sanitiser, compose, formatters, unit tests; `npm test` and `npm run qa:studio` scripts | `src/data/presets.js`, `src/studio/format.js`, `fields.js`, `sanitise.js`, `compose.js`, `tests/studio/core.test.js`, `package.json` | none |
| 2 | Link codec (encode, decode, migrate, caps) | `src/studio/codec.js`, `tests/studio/codec.test.js` | 1 |
| 3 | Draft store and hook, message protocol, route parser, countdown and fit helpers | `src/studio/store.js`, `useDraft.js`, `protocol.js`, `src/lib/route.js`, `countdown.js`, `fit.js`, `tests/studio/store.test.js`, `protocol.test.js`, `lib.test.js` | 1 |
| 4 | Studio QA harness and fixtures (written to fail until later tasks land) | `scripts/qa-studio.mjs`, `scripts/fixtures/studio-cases.mjs` | 1 (imports `fields.js`, `codec.js`) |
| 5 | Preview bridge: iframe preview, child hook, focus guard | `src/studio/Preview.jsx`, `devices.js`, `useEmbedOverrides.js`, `src/lib/embedFocus.js`, `tests/studio/embedFocus.test.js` | 3 |
| 6 | Share sheet | `src/studio/ShareSheet.jsx` | 1, 2 |
| 7 | Studio screen: tokens and styles, editor, field, screen | `src/studio/Studio.jsx`, `Editor.jsx`, `Field.jsx`, `studio.css` | 1, 3, 5, 6 |
| 8 | App shell: router, viewer source, Customize in the gallery and bar | `src/App.jsx`, `src/gallery/Gallery.jsx`, `src/components/Pill.jsx`, `src/lib/hooks.js`, `src/lib/useInviteSource.js`, `src/gallery.css` | 2, 3, 5, 7 |
| 9 | Rajmahal pilot: editable-proof changes and the first `editable: true` | `src/templates/rajmahal/Rajmahal.jsx`, `rajmahal.css`, `Gate.jsx`, `gate.css`, `src/data/templates.js` | 8 |
| 10 | Docs, description, unit tests in CI, rollout checklist, full run | `README.md`, `index.html`, `docs/PLAN.md`, `.github/workflows/deploy.yml` | 9 |

Parallel lanes: after Task 1, Tasks 2, 3 and 4 run in parallel; after Task 3, Tasks 5 and 6 (needs 2) run in parallel; Task 7 joins them; Task 8 then 9 then 10 are sequential. Browser areas `edit-live`, `share`, `hostile`, `storage`, `gallery`, `mobile`, `focus` pass at the end of Task 8; `proof` passes at the end of Task 9. Before Task 8, Tasks 5 to 7 are checked by lint, build, unit tests and a manual smoke in `npm run dev`.

## 15. Where this differs from `docs/PLAN.md`

`docs/PLAN.md` is kept: 25 designs and gates, `?to=` and `?open=1`, share, RSVP reply links, replay, no backend, no QR, no PWA, no per-couple link previews. It differs from the repository in three places, and this spec follows the repository:

1. It plans `src/lib/share.js`, `tests/lib` and `@playwright/test`. The repository has none of these; its checks are `scripts/qa-gate.mjs` and `scripts/qa-all.mjs` on `playwright-core`, and there is no unit-test runner. The Studio adds `node:test` for pure functions (`tests/**/*.test.js`) and extends the `scripts/` harness in the same style.
2. It plans `guestName()` and `hasParam()` with a `loc` argument and `useRoute` returning an id; the repository has `guestName()` reading `window.location`, and `open=1` checked with a regex in `App.jsx`. The Studio replaces the regex with `parseHash()`; `guestName()` is unchanged.
3. It says the pill share URL is `#/t/<id>` plus `?to=`. The Studio makes it keep `?d=` (E5).

New work here does not weaken any `docs/PLAN.md` constraint: no new runtime dependency, `transform` and `opacity` for motion in the Studio's own animation, targets of 44px, hover only under `(hover: hover) and (pointer: fine)` (the Studio has no hover-only affordance), reduced-motion variants.

## 16. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | A link made with compression cannot be opened by an old browser or in-app WebView. | Plain links below 1,200 characters; a plain "older phones" link in the share sheet; a clear explanation page. Device pass in section 13. |
| R2 | An unproofed design breaks on emptied or long content. | `editable` flag; the Studio route says "not ready" without `?qa=1`; the checklist and fixtures gate each design. |
| R3 | People expect "edit after sharing" (Invifest advertises it). A hash link cannot change after it is sent. | Fine print in the share sheet; the Studio re-imports a link; a short-link service is out of scope (open question Q4). |
| R4 | Two app instances (Studio and preview) use memory on low-end phones. | Not measured. On a phone only one panel is visible but both stay mounted; if it fails the device pass, load the preview only when the Preview tab is first opened. |
| R5 | Real people paste personal data (names, venues, phone numbers) into a link. | Share sheet states anyone with the link can read it; data stays in the hash and local storage; S10 and S11. |
| R6 | A preset edit changes already-sent links for fields the sender never touched. | Presets change only for reviewer corrections, with a changelog; names, date, time, venue and city are warned about when untouched. |
| R7 | The preview iframe behaves differently inside the WhatsApp or Instagram in-app browser (cookies, `postMessage`, focus). | Device pass; the Studio can also be opened in the system browser. Not tested. |
| R8 | Grapheme counting differs between browsers (Firefox before 125 has no `Intl.Segmenter`; older engines split conjuncts). | Limits are soft; fallback is code points; the sanitiser and the counter use the same function. |
| R9 | IME composition (Gboard Hindi, transliteration) drops characters or jumps the caret in a controlled input. | The form never transforms the displayed value while typing (trim, cut and tidy happen only in derived copies), has no Enter handler and no `maxlength`. Manual test required. |
| R10 | The entry chunk grows for every guest (viewer needs decode and compose). | Measured: entry JS 218.5 kB to 239.6 kB (68.8 to 76.5 kB gzip, +7.7 kB). The Studio itself is a separate 18.1 kB chunk (6.3 kB gzip) plus 8.7 kB CSS, loaded only on `#/studio`. If it matters, split the editor-only pieces (`fields.js` labels) from the viewer. |

## 17. Open questions

1. **Branding.** Should a guest link carry MathCo or product branding ("Made with ..." or "Make your own")? Competitors differ (Canva free sites carry a footer; Greenvelope and Joy do not on cards). Default in this spec: none, a quiet "Make your own" link is not included (P4).
2. **Guest bar.** Should a guest of a personalised link see "All designs" at all? The spec says no; a "Make your own" link would be the exception.
3. **Variable counts.** Allow 2 to 6 ceremonies per design after each design is proofed? Needs a per-design range and layout work.
4. **Short links.** Is a link-shortening service acceptable (it adds a third party and a data flow, and needs IT approval under the org rules)? Out of scope here.
5. **Community review.** Who reads the wording of the tradition designs and the invocation/greeting caution text? Required before the tradition designs are marked editable.
6. **Scope of "Start over".** It clears shared fields and every tradition's edits. Should it offer "only this design family"?
7. **Real-device access.** Who can run the manual device pass (an iPhone, a low-end Android, WhatsApp on both)?
