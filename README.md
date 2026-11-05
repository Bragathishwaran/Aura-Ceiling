# AuraCeiling — Premium False Ceiling & Gypsum Contractor Template

A multi-page, production-ready HTML template built with Tailwind CSS (CDN), supporting Dark/Light modes and RTL.

## Structure

```
/project-root
├── index.html
├── agency-home.html
├── about.html
├── services.html
├── service-detail.html
├── gallery.html
├── pricing.html
├── blog.html
├── blog-detail.html
├── contact.html
├── 404.html
├── coming-soon.html
├── assets/
│   ├── css/tailwind-custom.css
│   ├── js/main.js
│   └── images/
└── README.md
```

## Setup

No build step required. Open any HTML file in a modern browser. Tailwind is loaded via CDN.

For production, you may compile Tailwind locally:

```bash
npm install -D tailwindcss
npx tailwindcss -i ./assets/css/tailwind-custom.css -o ./assets/css/tailwind.css --minify
```

Then replace the CDN script tag with a link to the compiled CSS.

## Features

- Dark / Light mode with localStorage persistence (no FOUC)
- RTL toggle
- Responsive, mobile-first layout
- Filterable service grid, gallery and blog
- Cost & pricing calculators
- Form validation
- Lightbox, accordion, testimonial slider, countdown

## Customization

- Colors: edit Tailwind config in each HTML head and CSS variables in `tailwind-custom.css`
- Content: replace Unsplash image URLs and text
- Icons: Lucide via CDN (`data-lucide="icon-name"`)

## License

Free to use for personal and commercial projects.