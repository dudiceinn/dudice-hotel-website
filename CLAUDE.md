# Dudice Hotel Website

## Overview
Luxury hotel marketing website for Dudice Hotel (Philippines), deployed to GitHub Pages at `dudicehotel.com`. Single-page static site with no backend — reservations are handled by an external Telegram bot hosted on Render (`https://hotel-reservation-bot.onrender.com`).

## Tech Stack
- **HTML/CSS/JS** — all in a single `index.html` file (no framework, no build tools)
- **External CDNs**: Google Fonts, Font Awesome 6.5.0, AOS (Animate On Scroll), Particles.js
- **External Services**: Tawk.to (live chat), Telegram bot (reservations)
- **Hosting**: GitHub Pages with custom domain via CNAME

## Project Structure
```
index.html   — entire website (HTML + embedded CSS + embedded JS, ~1100 lines)
CNAME        — GitHub Pages custom domain config (dudicehotel.com)
```

## Key Sections in index.html
- **CSS** (lines ~1–550): Custom properties, layout, animations, responsive breakpoints at 900px
- **HTML** (lines ~550–950): Hero, stats, about, rooms, amenities, quote, CTA, contact, footer
- **JS** (lines ~950–end): AOS init, particles config, custom cursor, counter animations, Tawk.to toggle

## External Integrations
- **Telegram Bot**: Reservation link points to `https://hotel-reservation-bot.onrender.com/` (separate repo)
- **Tawk.to**: Live chat widget (ID: `69a03124aa3f391c3cc24160/1jicrvu7j`)
- **Telegram Contact**: `@DudiceMichael`

## Known Incomplete Items
- Phone number is placeholder: `+63 XXX XXX XXXX`
- Stats claim "7 Room Types" but only 3 rooms are displayed
- Facebook and Instagram social links point to `#`
- No actual hotel images — using Font Awesome icons as placeholders
- Contact address is vague ("Philippines" with no specific location)
- No meta description or Open Graph tags

## Development Notes
- No build system — edit `index.html` directly and push to deploy
- No package.json, no dependencies to install
- CSS uses a gold/dark theme via custom properties (e.g., `--gold`, `--dark`)
- Responsive breakpoint is 900px
- Custom cursor is hidden on mobile via CSS
