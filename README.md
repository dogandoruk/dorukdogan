# Doruk Doğan — Personal Portfolio & Case Study Hub

A high-performance portfolio website built with **Astro** and **Tailwind CSS**, designed to showcase enterprise digital growth achievements (Performance Marketing, Technical SEO, Omnichannel Operations) alongside custom AI and automation software projects.

---

## 🚀 Quick Start & Local Preview

### Option 1: One-Click Launch (Windows)
Double-click `launch.bat` in this folder. It will:
1. Verify npm packages
2. Start the local server
3. Open `http://localhost:4321` automatically in your browser.

### Option 2: Command Line
```bash
npm install
npm run dev
```

---

## 📁 Project Structure

```text
Personal Website/
├── launch.bat             # 1-Click launcher & browser opener
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind theme & color tokens
├── src/
│   ├── components/        # UI components (Navbar, Footer, MetricCard, StarSection, etc.)
│   ├── layouts/           # Layout.astro (Base) & DetailLayout.astro (STAR Case Studies)
│   ├── pages/
│   │   ├── index.astro                     # Master Homepage
│   │   ├── case-studies/                   # Enterprise Case Studies
│   │   │   ├── index.astro                 # Case studies archive
│   │   │   ├── rituals-performance-marketing.astro
│   │   │   ├── philips-ab-testing.astro
│   │   │   └── enterprise-seo-audits.astro
│   │   ├── projects/                       # AI & Builder Projects
│   │   │   ├── index.astro                 # Projects archive
│   │   │   ├── job-application-filler.astro
│   │   │   ├── la-by-night.astro
│   │   │   ├── monday-mage.astro
│   │   │   └── catspotting.astro
│   │   ├── education.astro                 # Kadir Has M.A. & Koç B.A.s + ICA Paris paper
│   │   └── certifications.astro            # Verified credentials with category filtering
│   └── data/                              # JSON data models for easy editing
│       ├── cv.json
│       ├── education.json
│       ├── certifications.json
│       ├── case-studies.json
│       └── projects.json
└── public/
    └── favicon.svg
```

---

## 🌐 Deploying to a Custom Domain

When you are ready to host the website online on a domain:

### 1. Build Static Output
```bash
npm run build
```
This generates pure, lightning-fast static HTML/CSS/JS in the `/dist` directory.

### 2. Free Hosting Options
- **Cloudflare Pages**: Connect your Git repo or drag-and-drop the `/dist` folder. Add your custom domain in the Cloudflare dashboard.
- **Vercel**: Run `npx vercel` or import from GitHub. Free custom domain SSL included.
- **Netlify**: Connect Git repository, set build command to `npm run build` and publish directory to `dist`.
- **GitHub Pages**: Set source to GitHub Actions with the Astro deployment workflow.
