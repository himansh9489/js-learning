# SEO (Search Engine Optimisation) in React

---

## What Is SEO?

SEO is the practice of structuring and presenting web content so that search engines (Google, Bing, DuckDuckGo) can **discover, understand, and rank** it correctly — and so users find it when searching for relevant terms.

Search engines use **crawlers** (bots) that:

1. **Crawl** — follow links and fetch pages
2. **Index** — parse HTML, extract content and signals, store in a database
3. **Rank** — score pages against queries and return ordered results

Your job as a developer is to make sure crawlers can complete all three steps correctly.

---

## Why SEO Matters


| Reason                  | Detail                                                                        |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Organic traffic**     | 68% of all online experiences begin with a search engine                      |
| **Cost efficiency**     | Organic clicks cost nothing vs paid ads                                       |
| **Credibility**         | High rankings signal trust to users                                           |
| **Compounding returns** | Good content + good SEO = traffic that grows over time                        |
| **Business survival**   | For e-commerce, blogs, SaaS — search is often the primary acquisition channel |


---

## What Search Engines Actually Measure

Google's ranking algorithm weighs hundreds of signals. The main ones relevant to frontend developers:


| Signal Category         | What It Includes                                                  |
| ----------------------- | ----------------------------------------------------------------- |
| **Content relevance**   | Keywords in title, headings, body text, alt text                  |
| **Page experience**     | Core Web Vitals (LCP, CLS, INP), mobile-friendliness, HTTPS       |
| **Crawlability**        | Robots.txt, XML sitemap, canonical tags, internal linking         |
| **Technical structure** | Semantic HTML, structured data (Schema.org), meta tags            |
| **Backlinks**           | External sites linking to you (developer has little control here) |
| **E-E-A-T**             | Experience, Expertise, Authoritativeness, Trustworthiness         |


---

## The Core SEO Problem With React SPAs

React (CSR — Client-Side Rendering) ships an empty HTML shell:

```html
<!-- What the server sends — crawlers see this -->
<!DOCTYPE html>
<html>
	<head>
		<title>App</title>
	</head>
	<body>
		<div id="root"></div>
		<!-- empty — no content -->
		<script src="/bundle.js"></script>
	</body>
</html>
```

Googlebot does execute JavaScript (with a delay), but:

- It may render your page seconds to days after the initial crawl
- Bing, DuckDuckGo, and social media crawlers (Facebook, Twitter) often **do not execute JS**
- Dynamic meta tags (title, description, og:image) are invisible to non-JS crawlers

**Result:** Your carefully crafted React UI may be invisible to most crawlers.

---

## Rendering Strategies and Their SEO Impact


| Strategy                | SEO Impact | How                                                                            |
| ----------------------- | ---------- | ------------------------------------------------------------------------------ |
| **CSR (Vite SPA)**      | Poor       | Crawlers see empty shell; JS-rendered content indexed with delay or not at all |
| **SSR (Next.js)**       | Excellent  | Full HTML with real content sent on every request                              |
| **SSG (Next.js/Astro)** | Excellent  | Pre-built HTML; instant for crawlers, no server needed                         |
| **ISR**                 | Excellent  | Like SSG but revalidated periodically                                          |
| **Pre-rendering**       | Good       | Build-time HTML snapshot; works for mostly-static pages                        |


> For this `gold-invest` project (WebView MFE inside BharatPe app) — SEO is **not applicable** because the app runs inside a native WebView, not a public browser tab. The concepts below apply to public-facing React apps.

---

## 1. Meta Tags — The Identity of a Page

Meta tags live in `<head>` and tell search engines and social platforms about the page.

### Essential meta tags

```html
<head>
	<!-- Title — most important on-page SEO element, shown in search results -->
	<!-- Optimal length: 50–60 characters -->
	<title>Buy 24K Digital Gold Online | BharatPe Gold</title>

	<!-- Description — shown under title in search results (not a ranking factor, but affects CTR) -->
	<!-- Optimal length: 150–160 characters -->
	<meta
		name="description"
		content="Buy 24-karat digital gold safely with BharatPe. Start with ₹1. Insured storage, instant purchase, best prices. No locker needed." />

	<!-- Canonical — prevents duplicate content penalty by declaring the authoritative URL -->
	<link rel="canonical" href="https://bharatpe.com/gold/buy" />

	<!-- Robots — control crawler behaviour -->
	<meta name="robots" content="index, follow" />
	<!-- default -->
	<meta name="robots" content="noindex, nofollow" />
	<!-- private pages, admin -->
	<meta name="robots" content="index, nofollow" />
	<!-- index but don't follow links -->

	<!-- Viewport — required for mobile-friendliness (ranking factor) -->
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
```

### Open Graph — social media sharing

When a URL is shared on WhatsApp, Facebook, Twitter etc., these tags control the preview card:

```html
<meta property="og:title" content="Buy 24K Digital Gold | BharatPe" />
<meta property="og:description" content="Start investing in gold from just ₹1. Safe, insured, instant." />
<meta property="og:image" content="https://cdn.bharatpe.com/gold/og-image-1200x630.webp" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://bharatpe.com/gold" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="BharatPe" />
```

### Twitter Card

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@bharatpe" />
<meta name="twitter:title" content="Buy 24K Digital Gold | BharatPe" />
<meta name="twitter:description" content="Start investing in gold from just ₹1." />
<meta name="twitter:image" content="https://cdn.bharatpe.com/gold/twitter-card.webp" />
```

---

## 2. Managing Meta Tags in React

### Option A: `react-helmet-async` (for CSR/SSR apps)

```bash
npm install react-helmet-async
```

```tsx
// src/index.tsx — wrap app
import { HelmetProvider } from 'react-helmet-async';

root.render(
	<HelmetProvider>
		<App />
	</HelmetProvider>,
);
```

```tsx
// Any page component
import { Helmet } from 'react-helmet-async';

function GoldLandingPage() {
	return (
		<>
			<Helmet>
				<title>Buy 24K Digital Gold Online | BharatPe Gold</title>
				<meta name="description" content="Start investing in gold from just ₹1. Safe and insured." />
				<meta property="og:title" content="Buy 24K Digital Gold | BharatPe" />
				<meta property="og:image" content="https://cdn.bharatpe.com/gold/og-image.webp" />
				<link rel="canonical" href="https://bharatpe.com/gold" />
			</Helmet>

			<main>
				<h1>Buy Digital Gold</h1>
				{/* page content */}
			</main>
		</>
	);
}
```

### Option B: Next.js `<Head>` (Pages Router)

```tsx
import Head from 'next/head';

export default function GoldPage({ product }: { product: GoldProduct }) {
	return (
		<>
			<Head>
				<title>{product.name} | BharatPe Gold</title>
				<meta name="description" content={product.description} />
				<meta property="og:title" content={product.name} />
				<meta property="og:image" content={product.imageUrl} />
			</Head>
			<main>
				<h1>{product.name}</h1>
			</main>
		</>
	);
}
```

### Option C: Next.js `metadata` export (App Router — recommended)

```tsx
// app/gold/page.tsx
import { Metadata } from 'next';

// Static metadata
export const metadata: Metadata = {
	title: 'Buy 24K Digital Gold | BharatPe',
	description: 'Start investing in gold from just ₹1. Safe, insured, instant.',
	openGraph: {
		title: 'Buy 24K Digital Gold | BharatPe',
		description: 'Start investing in gold from just ₹1.',
		images: [{ url: 'https://cdn.bharatpe.com/gold/og-image.webp', width: 1200, height: 630 }],
		url: 'https://bharatpe.com/gold',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Buy 24K Digital Gold | BharatPe',
	},
	alternates: {
		canonical: 'https://bharatpe.com/gold',
	},
};

export default function GoldPage() {
	return (
		<main>
			<h1>Buy Digital Gold</h1>
		</main>
	);
}
```

```tsx
// Dynamic metadata (per product)
// app/gold/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
	const product = await fetchProduct(params.id);

	return {
		title: `${product.name} | BharatPe Gold`,
		description: product.description,
		openGraph: {
			title: product.name,
			images: [{ url: product.imageUrl }],
		},
	};
}
```

---

## 3. Semantic HTML Structure for SEO

Search engines build a content model from your HTML. Good semantic structure directly helps ranking.

```tsx
// ❌ Non-semantic — crawler can't infer content hierarchy
<div className="page">
  <div className="header">BharatPe Gold</div>
  <div className="content">
    <div className="title">Buy Digital Gold</div>
    <div className="text">Start from ₹1...</div>
    <div className="section-title">Why Gold?</div>
    <div className="text">Gold is a safe haven...</div>
  </div>
</div>

// ✅ Semantic — crawler understands the hierarchy
<header>
  <nav aria-label="Main navigation">
    <a href="/gold">BharatPe Gold</a>
  </nav>
</header>
<main>
  <article>
    <h1>Buy Digital Gold</h1>   {/* one h1 per page */}
    <p>Start investing from just ₹1 with BharatPe's digital gold.</p>

    <section aria-labelledby="why-gold">
      <h2 id="why-gold">Why Invest in Gold?</h2>
      <p>Gold is a safe haven asset that protects against inflation...</p>

      <h3>Safe Storage</h3>
      <p>Your gold is stored in insured vaults by SafeGold...</p>
    </section>
  </article>
</main>
<footer>
  <p>© 2026 BharatPe. All rights reserved.</p>
</footer>
```

### Heading hierarchy rules

```
✅ One <h1> per page — the primary topic
✅ <h2> for major sections
✅ <h3> for sub-sections within h2
✅ Never skip levels (h1 → h3 without h2)
❌ Using headings for styling (use CSS instead)
❌ Multiple <h1>s on one page
```

---

## 4. Structured Data (Schema.org / JSON-LD)

Structured data is machine-readable metadata embedded in the page. It enables **rich results** in Google Search — star ratings, FAQs, breadcrumbs, product prices shown directly in search results.

Format: JSON-LD inside a `<script type="application/ld+json">` tag.

### Product schema (e-commerce)

```tsx
function GoldProductPage({ product }: { product: GoldProduct }) {
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: product.description,
		image: product.imageUrl,
		brand: { '@type': 'Brand', name: 'BharatPe Gold' },
		offers: {
			'@type': 'Offer',
			price: product.pricePerGram,
			priceCurrency: 'INR',
			availability: 'https://schema.org/InStock',
			url: `https://bharatpe.com/gold/buy`,
		},
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '4.8',
			reviewCount: '12500',
		},
	};

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
			<main>
				<h1>{product.name}</h1>
			</main>
		</>
	);
}
```

### FAQ schema (enables FAQ rich results in SERP)

```tsx
const faqSchema = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: [
		{
			'@type': 'Question',
			name: 'Is BharatPe gold insured?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'Yes. All gold purchased through BharatPe is stored in MMTC-PAMP certified vaults and is fully insured.',
			},
		},
		{
			'@type': 'Question',
			name: 'What is the minimum gold purchase amount?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'You can start buying gold for as little as ₹1.',
			},
		},
	],
};
```

### Breadcrumb schema

```tsx
const breadcrumbSchema = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bharatpe.com' },
		{ '@type': 'ListItem', position: 2, name: 'Gold', item: 'https://bharatpe.com/gold' },
		{ '@type': 'ListItem', position: 3, name: 'Buy Gold', item: 'https://bharatpe.com/gold/buy' },
	],
};
```

---

## 5. URL Structure

URLs are a ranking signal. Clean, descriptive URLs help crawlers and users.

```
❌ Bad URLs
https://bharatpe.com/p?id=123
https://bharatpe.com/page1
https://bharatpe.com/gold/buy?ref=abc&session=xyz123

✅ Good URLs
https://bharatpe.com/gold/buy
https://bharatpe.com/gold/faq
https://bharatpe.com/blog/how-to-invest-in-gold

Rules:
- Lowercase only
- Hyphens to separate words (not underscores)
- Descriptive, keyword-rich paths
- No unnecessary query parameters in canonical URLs
- Short as possible while still descriptive
```

### Handling query params and canonical

```tsx
// If /gold/buy?ref=campaign should be treated the same as /gold/buy for SEO:
<link rel="canonical" href="https://bharatpe.com/gold/buy" />
// Canonical points to the clean URL regardless of query params
```

---

## 6. `robots.txt` and XML Sitemap

### robots.txt

Controls which pages crawlers are allowed to fetch. Lives at `yourdomain.com/robots.txt`.

```
# Allow all crawlers to everything
User-agent: *
Disallow:

# Block specific paths from all crawlers
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /user/settings
Allow: /

# Block a specific bot
User-agent: AhrefsBot
Disallow: /

# Sitemap location
Sitemap: https://bharatpe.com/sitemap.xml
```

### XML Sitemap

Lists all public URLs on your site. Helps crawlers discover pages that may not be linked internally.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bharatpe.com/gold</loc>
    <lastmod>2026-05-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bharatpe.com/gold/buy</loc>
    <lastmod>2026-05-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bharatpe.com/gold/faq</loc>
    <lastmod>2026-04-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

In Next.js App Router, generate it programmatically:

```ts
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const products = await fetchAllProducts();

	return [
		{ url: 'https://bharatpe.com/gold', lastModified: new Date(), priority: 1 },
		{ url: 'https://bharatpe.com/gold/buy', lastModified: new Date(), priority: 0.9 },
		...products.map((p) => ({
			url: `https://bharatpe.com/gold/products/${p.slug}`,
			lastModified: new Date(p.updatedAt),
			priority: 0.7,
		})),
	];
}
```

---

## 7. Core Web Vitals as SEO Signals

Since 2021, Google uses Core Web Vitals as a **direct ranking factor** (Page Experience signal).


| Metric          | Threshold | What to do                                                                    |
| --------------- | --------- | ----------------------------------------------------------------------------- |
| **LCP** ≤ 2.5s  | Good      | Preload hero image, use CDN, reduce TTFB, lazy-load offscreen images          |
| **CLS** ≤ 0.1   | Good      | Always set width/height on images/videos, no late-injected content above fold |
| **INP** ≤ 200ms | Good      | Avoid long JS tasks, debounce inputs, virtualise lists                        |


Measure in production with:

```bash
# Install web-vitals
npm install web-vitals

# src/utils/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, id }: { name: string; value: number; id: string }) {
  // Send to your analytics service
  console.info(`[Web Vital] ${name}: ${Math.round(value)}ms`);
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

---

## 8. Image SEO

```tsx
// ✅ Always include descriptive alt text — crawlers index alt text
<img
	src="https://cdn.bharatpe.com/gold/gold-bar-1gram.webp"
	alt="1-gram 24-karat digital gold bar available on BharatPe"
	width={400}
	height={400} // prevents CLS — browser reserves space before image loads
	loading="lazy" // defer offscreen images
/>

// ✅ Use descriptive file names — they are a minor ranking signal
// Good:  24k-digital-gold-bar-1gram.webp
// Bad:   IMG_20240312_114523.webp

// ✅ Use modern formats — smaller files = faster LCP
// AVIF > WebP > JPEG for photos
// SVG for icons and illustrations

// ✅ Serve via CDN with appropriate Cache-Control headers
```

---

## 9. Internal Linking

Internal links distribute "link equity" (PageRank) across your site and help crawlers discover content.

```tsx
// ✅ Use descriptive anchor text — not "click here" or "read more"
<a href="/gold/buy">Buy 24-karat digital gold</a>      {/* descriptive */}
<a href="/gold/faq">Gold investment FAQs</a>            {/* descriptive */}

// ❌ Non-descriptive anchor text
<a href="/gold/buy">Click here</a>
<a href="/gold/faq">Read more</a>

// ✅ Breadcrumb navigation aids both SEO and usability
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/gold">Gold</a></li>
    <li aria-current="page">Buy Gold</li>
  </ol>
</nav>
```

---

## 10. Pre-rendering for CSR Apps (when SSR is not an option)

If you must use a CSR React app for a public-facing page, pre-rendering generates static HTML snapshots at build time without a runtime server:

```bash
npm install --save-dev react-snap   # or vite-plugin-prerender
```

```js
// package.json — react-snap post-build hook
{
  "scripts": {
    "postbuild": "react-snap"
  },
  "reactSnap": {
    "puppeteerArgs": ["--no-sandbox"],
    "inlineCss": true
  }
}
```

This crawls your built app, renders it with a headless browser, and saves the HTML output. Crawlers then receive real HTML without executing JS.

**Limitation:** only works for pages with static, non-user-specific content.

---

## SEO Checklist


| Category            | Item                                                       |
| ------------------- | ---------------------------------------------------------- |
| **Meta**            | Unique `<title>` (50–60 chars) per page                    |
| **Meta**            | Unique `<meta description>` (150–160 chars) per page       |
| **Meta**            | `<link rel="canonical">` on every page                     |
| **Meta**            | Open Graph tags for social sharing                         |
| **Structure**       | One `<h1>` per page with primary keyword                   |
| **Structure**       | Logical heading hierarchy (h1 → h2 → h3)                   |
| **Structure**       | Semantic HTML elements (main, nav, article, section)       |
| **Structure**       | Descriptive internal link anchor text                      |
| **Images**          | Descriptive `alt` text on all informative images           |
| **Images**          | `width` + `height` set to prevent CLS                      |
| **Images**          | Modern formats (WebP/AVIF), served via CDN                 |
| **Technical**       | `robots.txt` configured                                    |
| **Technical**       | XML sitemap submitted to Google Search Console             |
| **Technical**       | HTTPS (required for ranking)                               |
| **Technical**       | Mobile-friendly (responsive design)                        |
| **Performance**     | LCP ≤ 2.5s                                                 |
| **Performance**     | CLS ≤ 0.1                                                  |
| **Performance**     | INP ≤ 200ms                                                |
| **Structured data** | JSON-LD schema where applicable (Product, FAQ, Breadcrumb) |


---

## Interview Q&A

**Q1. Why does a standard React SPA (CSR) have poor SEO, and how do you fix it?**

A CSR React app sends an empty HTML shell — `<div id="root"></div>` — and builds the UI in the browser via JavaScript. Most crawlers (Bing, DuckDuckGo, social media bots) do not execute JavaScript, so they index an empty page. Even Googlebot, which does execute JS, delays rendering by seconds to days, meaning your content may not be indexed promptly.

Fixes in order of effectiveness:

1. **SSR (Next.js, Remix)** — server renders full HTML on every request.
2. **SSG (Next.js/Astro)** — generates full HTML at build time.
3. **Pre-rendering** (`react-snap`, `vite-plugin-prerender`) — static HTML snapshots at build time.
4. **Dynamic rendering** — serve pre-rendered HTML to bots, JS to browsers (not recommended by Google).

---

**Q2. What is the difference between `<title>`, `<meta description>`, and Open Graph tags? Which affect ranking?**

- `**<title>`**: The blue link text shown in search results. A direct on-page ranking signal — include your primary keyword. Keep it 50–60 characters.
- `**<meta name="description">**`: The snippet shown under the title in search results. **Not a direct ranking signal**, but heavily affects click-through rate (CTR), which indirectly influences ranking. Keep it 150–160 characters.
- **Open Graph tags** (`og:title`, `og:description`, `og:image`): Not a Google ranking signal. Control how the page appears when shared on social media (Facebook, WhatsApp, Twitter). A compelling og:image dramatically increases social share engagement.

---

**Q3. What is a canonical tag and why is it important?**

`<link rel="canonical" href="https://example.com/page">` tells search engines which URL is the authoritative version of a page when the same content is accessible at multiple URLs. Without it, Google may:

- Split ranking signals between duplicate URLs
- Index the wrong version
- Apply a duplicate content penalty

Common scenarios requiring canonical: UTM parameters (`?utm_source=email`), session IDs, `www` vs non-`www`, HTTP vs HTTPS, trailing slash vs no trailing slash, paginated content.

Always set canonical to the clean, preferred URL.

---

**Q4. What is structured data and what does it do for search results?**

Structured data is machine-readable metadata embedded in a page using JSON-LD (preferred), Microdata, or RDFa, following Schema.org vocabulary. It does not directly improve ranking but enables **rich results** — enhanced search snippets that include:

- Star ratings on product/review pages
- FAQ dropdowns directly in search results
- Breadcrumb trails
- Event dates and prices
- Recipe calories and cook times

Rich results have significantly higher CTR than standard blue links. For e-commerce, Product + Offer + AggregateRating schema is high-value.

---

**Q5. How do Core Web Vitals affect SEO?**

Since May 2021, Google uses Core Web Vitals as a **ranking tiebreaker** (Page Experience signal). When two pages have similar relevance and content quality, the one with better Core Web Vitals ranks higher. The three metrics:

- **LCP** (Largest Contentful Paint) ≤ 2.5s — perceived load speed
- **CLS** (Cumulative Layout Shift) ≤ 0.1 — visual stability
- **INP** (Interaction to Next Paint) ≤ 200ms — responsiveness

In practice, vitals rarely override content quality, but for competitive niches they can be the deciding factor. They also directly affect user experience, which influences bounce rate and dwell time — indirect ranking signals.

---

**Q6. What is the difference between `index`/`noindex` and `robots.txt` disallow?**

Both control crawler access, but at different levels:

- `**robots.txt` Disallow**: Blocks the crawler from fetching the URL at all. The page still may appear in search results if other sites link to it — Google knows it exists but can't read it.
- `**<meta name="robots" content="noindex">`**: Allows the crawler to fetch the page but instructs it not to include the page in the index. The page will not appear in search results.

For pages you want completely hidden from search, use `noindex`. For pages you don't want crawlers to waste budget on (e.g. internal APIs), use `robots.txt Disallow`. Never use both together for the same page — if robots.txt blocks the crawler, it can't read the noindex tag.

---

**Q7. What is dynamic metadata in Next.js and when do you need it?**

Static `metadata` export covers pages where the meta content is the same on every visit. Dynamic metadata is needed when meta content depends on data fetched at request time — e.g. a product page where the title, description, and og:image come from a database.

```ts
// app/gold/[id]/page.tsx
export async function generateMetadata({ params }) {
	const product = await fetchProduct(params.id);
	return {
		title: `${product.name} | BharatPe Gold`,
		openGraph: { images: [{ url: product.imageUrl }] },
	};
}
```

Next.js calls `generateMetadata` on the server before rendering, so the `<head>` tags are present in the initial HTML that crawlers receive.

---

**Q8. How do you handle SEO for a paginated list (e.g., transaction history page 1, 2, 3...)?**

Three approaches:

1. `**rel="next"` / `rel="prev"`** (deprecated by Google but still used): Signal pagination relationship between pages.
2. **Canonical to page 1**: If pages 2+ are thin content, canonical all of them to page 1. Risky — page 2+ won't be indexed.
3. **Independent canonical per page** (recommended): Each paginated page is unique, has its own canonical URL, and contains enough unique content. Include `?page=2` in the URL and canonical.

For most apps, paginated list pages (transaction history, order history) are behind login and should be `noindex` anyway — pagination SEO matters primarily for public content like blog post lists or product catalogs.

---

**Q9. What is a `robots.txt` and what happens if you misconfigure it?**

`robots.txt` is a plain text file at the root of your domain that instructs crawlers which paths they are allowed to fetch. It is a convention (the Robots Exclusion Protocol), not enforced — malicious bots ignore it.

Misconfiguration consequences:

- `Disallow: /` — accidentally blocks all crawlers from your entire site; your site disappears from search results within days.
- Blocking CSS/JS paths — Google cannot render the page correctly and may downrank or not index it.
- Blocking your sitemap path — crawlers can't find your sitemap.

Always verify with Google Search Console's robots.txt tester after changes.

---

**Q10. How does React's `dangerouslySetInnerHTML` relate to SEO and why is the name appropriate?**

`dangerouslySetInnerHTML` is used in React to inject raw HTML strings into the DOM, bypassing React's JSX sanitisation. For SEO, it has a legitimate use: injecting JSON-LD structured data via `<script type="application/ld+json">` tags, since JSON-LD is a script tag that React can't represent as JSX naturally.

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
```

The name is "dangerous" because misuse — injecting user-provided strings — creates XSS vulnerabilities. If the content is attacker-controlled and injected via `dangerouslySetInnerHTML`, they can execute arbitrary JavaScript. For structured data specifically, the risk is contained because the content is developer-controlled server data, not user input. Always `JSON.stringify` the schema object (never template-string concatenate user data into it).