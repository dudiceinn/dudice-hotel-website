# Dudice Hotel website

Static hotel website hosted on GitHub Pages at https://dudicehotel.com/. No build or application dependencies are required.

- `index.html`: rooms, published walk-in rates, photo galleries, FAQs, and contact information.
- `styles.css`: shared responsive layout and policy-page styles.
- `site.js`: native dialog navigation/galleries, room filters, and local inquiry preparation.
- `privacy.html`, `terms.html`: guest policies.
- `images/`: existing local hotel photographs and gallery manifest.

## Preview

From this directory, run `python -m http.server 8765 --bind 127.0.0.1`, then open http://127.0.0.1:8765/.

## Booking behavior

Room inquiries are assembled in the browser. Guests copy the message and paste it into Messenger, or use the email link. Opening Messenger does not submit a reservation. No dates, guest counts, or inquiry messages are stored or sent by this website, and no analytics service is configured.

The displayed prices remain the existing walk-in rates. The team confirms reservation prices, availability, deposit requirements, and extra-guest charge periods. Arrival is flexible: the selected 12 or 24 hours start at check-in. Update the homepage and terms together when policies change.

## Browser checks

`tests/browser-smoke.mjs` uses Node 22+ built-in APIs, with no npm installation. Start a local HTTP server as above and a separate Chrome testing instance with `--headless --remote-debugging-port=9232 --remote-debugging-address=127.0.0.1` and an isolated `--user-data-dir`. Run `node tests/browser-smoke.mjs`.

Override the server/debugging addresses with `SITE_URL` and `CHROME_DEBUG_URL` environment variables. Checks cover responsive overflow and image sizing, mobile menu focus/closing, gallery navigation, filters, inquiry context, clipboard denial, policy links, and no-JavaScript fallbacks. Third-party resources are blocked during the checks. Screenshots are saved to the system temporary directory.
