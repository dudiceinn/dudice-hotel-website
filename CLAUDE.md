# Dudice Hotel Website

## Overview

Static hotel marketing website for Dudice Hotel in Mariveles, Bataan, deployed to GitHub Pages at `dudicehotel.com`. No backend or build system is included in this repository.

## Files

- `index.html`: homepage, room cards/rates, native dialogs, FAQs, and hotel metadata.
- `styles.css`: shared responsive styles, including policy pages.
- `site.js`: mobile navigation, capacity/rate filters, photo galleries, and local room inquiry preparation.
- `privacy.html`, `terms.html`: policies, with flexible arrival reflected in the terms.
- `images/`: local hotel photographs and `manifest.json`.
- `tests/browser-smoke.mjs`: dependency-free Node browser checks using Chrome's debugging endpoint.
- `README.md`: local preview and testing instructions.

## Integrations and behavior

- Messenger: `https://m.me/dudiceinn`; Facebook: `https://www.facebook.com/dudiceinn`.
- Google Fonts, Font Awesome CSS, and Google Maps are optional external resources. Navigation and galleries have no external JavaScript dependencies.
- Room inquiries open a native dialog and prepare text for manual copying into Messenger or an email link. The website does not send messages, reserve inventory, verify payments, or query booking status.
- Without JavaScript, navigation remains visible, photo links open the original image, and room inquiry links open Messenger.
- No analytics service is configured. Do not interpret inquiry clicks as completed bookings.

## Content rules

- Arrival is flexible. A booked 12- or 24-hour stay starts at actual check-in; availability must still be confirmed.
- Published prices are walk-in rates. Reservation rates, availability, deposits, and extra-guest charge periods are confirmed by the hotel team.
- Existing deposit/cancellation policy text remains in `terms.html`; do not invent replacement business policies.
- Use real property photos and factual amenities. Do not invent guest reviews, ratings, or luxury claims.

## Development

No framework is needed. Keep functional links as fallbacks, use semantic HTML and accessible modal focus handling, and respect reduced-motion preferences. The palette is teal, cream, and sand. Preserve the pre-existing local company-profile files.
