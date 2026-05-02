# Progressive Web Apps (PWA)

---

## What is a PWA?

A **Progressive Web App** is a web application that uses modern browser APIs and progressive enhancement strategies to deliver a native app-like experience on any device. It is still a website — served over HTTP(S), discoverable by search engines — but it behaves like an installed app.

The term was coined by Google engineers Alex Russell and Frances Berriman in 2015. The "progressive" part means the app degrades gracefully: users on capable browsers get the full experience; users on older browsers still get a working website.

### Three Pillars

| Pillar          | What it means                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Capable**     | Access to camera, microphone, geolocation, push notifications, background sync, file system — APIs once exclusive to native apps |
| **Reliable**    | Works offline or on flaky networks; loads instantly; never shows a browser error page                                            |
| **Installable** | Can be added to the home screen; runs in a standalone window without browser chrome                                              |

---

## Core Technologies

### 1. Service Worker

A **Service Worker** is a JavaScript file that runs in a separate thread (off the main thread), acting as a programmable network proxy. It intercepts all network requests from the page and decides what to do with each one: serve from cache, fetch from network, return a fallback, etc.

**Lifecycle:**

```
Register → Download → Install → Activate → Idle → (Fetch/Message events) → Terminate
```

- **Register:** The page calls `navigator.serviceWorker.register('/sw.js')`.
- **Install:** The browser downloads the SW file. The `install` event fires — you pre-cache critical assets here.
- **Activate:** The SW takes control. The `activate` event fires — you clean up old caches here.
- **Fetch:** Every network request from the page (and sub-resources) passes through the SW's `fetch` event handler.

> Service Workers only run over **HTTPS** (or `localhost` for development). This is a security requirement — a SW on HTTP could be man-in-the-middled to intercept all traffic.

### 2. Web App Manifest

A JSON file that describes your app to the browser: name, icons, start URL, display mode, theme colour. The browser reads this to know how to render the app when installed.

```json
{
	"name": "Gold Invest",
	"short_name": "Gold",
	"description": "Buy and sell digital gold",
	"start_url": "/",
	"display": "standalone",
	"background_color": "#007270",
	"theme_color": "#007270",
	"orientation": "portrait",
	"icons": [
		{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
		{ "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
		{ "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
	]
}
```

**`display` values:**

| Value        | Behaviour                                                        |
| ------------ | ---------------------------------------------------------------- |
| `standalone` | No browser URL bar. Feels like a native app. Most common choice. |
| `fullscreen` | Completely full screen (games).                                  |
| `minimal-ui` | Tiny browser controls (back/refresh), no URL bar.                |
| `browser`    | Normal browser tab. No installation benefit.                     |

### 3. HTTPS

Service Workers require a secure context. Every PWA must be served over HTTPS in production. `localhost` is the only exception (for development).

---

## Why Use a PWA?

### Problems PWAs Solve

| Problem                                                 | PWA Solution                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Slow initial load on 3G / bad network                   | Pre-cache critical assets in SW `install`; serve instantly from cache   |
| App unusable offline                                    | Cache-first or stale-while-revalidate strategies keep content available |
| Native app install friction (app store, 60 MB download) | One-tap install from browser, ~1 MB                                     |
| Push notification reach                                 | Web Push API works without the app being open                           |
| Discoverability                                         | Still indexed by search engines; no App Store algorithms                |
| Cross-platform dev cost                                 | One codebase for web, Android, iOS, desktop                             |

### Business Impact (Real Numbers)

- **Twitter Lite PWA:** 65% increase in pages per session, 75% more tweets sent, 20% decrease in bounce rate.
- **Pinterest PWA:** 60% increase in core engagements, 44% increase in ad revenue from users.
- **Alibaba:** 76% higher conversions across browsers after rebuilding as a PWA.
- **Starbucks PWA:** 2× daily active users; works fully offline for menu browsing and order building.

---

## When to Use a PWA

### Use a PWA when:

- Your users are in **emerging markets** with unreliable or expensive mobile data (offline-first matters).
- You want **cross-platform reach** without maintaining separate iOS and Android codebases.
- Your app is **content or form-heavy** (news, e-commerce, fintech dashboards) — caching strategies provide huge UX wins.
- You need **push notifications** to re-engage users without requiring an app install.
- App Store submission overhead or cost is a barrier.
- Your app is already a React SPA — adding PWA capabilities is low effort.

### Do NOT use a PWA (or it won't help much) when:

- You need **deep hardware access** (Bluetooth, NFC on iOS, ARKit/ARCore) — native apps still lead here.
- Your app is a **game with high-performance graphics** — WebGL/WebGPU PWAs are possible but native still wins on performance.
- You're building **on iOS and need Apple Pay or Face ID** — limited PWA support on iOS Safari for these.
- Your **entire UX is offline** with complex local data (e.g., a medical records app) — consider React Native.

---

## Where PWAs Are Used

| Industry     | Example                                   |
| ------------ | ----------------------------------------- |
| E-commerce   | Flipkart Lite, AliExpress, Myntra         |
| Finance      | Starbucks, Trivago, Financial Times       |
| Social       | Twitter Lite, Pinterest, Instagram (lite) |
| News / Media | The Washington Post, Forbes               |
| Productivity | Google Docs, Notion, VS Code (web)        |
| Travel       | Booking.com, MakeMyTrip                   |

---

## Caching Strategies

The service worker `fetch` event is where you implement caching strategy. There is no single "best" strategy — choose based on the resource type.

### 1. Cache First (Cache Falling Back to Network)

Serve from cache if available; only go to the network if the cache misses. Best for **static assets** that rarely change (fonts, icons, images).

```js
// sw.js
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((cached) => {
			return cached ?? fetch(event.request);
		}),
	);
});
```

**Trade-off:** Users may see stale content until the next cache update.

### 2. Network First (Network Falling Back to Cache)

Always try the network; fall back to cache only if the network fails. Best for **API calls** where freshness is important but offline fallback is needed.

```js
self.addEventListener('fetch', (event) => {
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Clone and store in cache before returning
				const clone = response.clone();
				caches.open('api-cache-v1').then((cache) => cache.put(event.request, clone));
				return response;
			})
			.catch(() => caches.match(event.request)),
	);
});
```

**Trade-off:** Slow on bad networks (waits for network timeout before using cache).

### 3. Stale-While-Revalidate

Serve the cached version immediately (fast), then fetch from the network in the background and update the cache. Best for **non-critical content** where you want speed AND eventual freshness (e.g., news feed, product listings).

```js
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.open('swr-cache-v1').then((cache) => {
			return cache.match(event.request).then((cached) => {
				const networkFetch = fetch(event.request).then((response) => {
					cache.put(event.request, response.clone());
					return response;
				});
				// Return cached immediately, update in background
				return cached ?? networkFetch;
			});
		}),
	);
});
```

### 4. Cache Only

Serve exclusively from cache; never hit the network. Used for **pre-cached static assets** during the install step.

### 5. Network Only

Never cache; always go to the network. Used for **analytics pings** or **POST requests** that must not be cached.

---

## Practical Example: Gold Invest PWA

This project already ships a service worker (`src/service-worker.ts`). Here's a walkthrough of a full PWA implementation pattern that mirrors what this codebase does.

### Step 1 — Register the Service Worker

```tsx
// src/index.tsx
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {
				console.info('SW registered:', registration.scope);
			})
			.catch((error) => {
				console.error('SW registration failed:', error);
			});
	});
}
```

> Always register after the `load` event so the SW setup doesn't compete with the critical rendering path.

### Step 2 — Pre-cache Critical Assets on Install

```js
// service-worker.js
const CACHE_NAME = 'gold-invest-v1';
const PRECACHE_URLS = [
	'/',
	'/index.html',
	'/assets/main.js',
	'/assets/main.css',
	'/offline.html', // Fallback page for total offline scenarios
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting()), // Activate immediately, don't wait for old SW to die
	);
});
```

### Step 3 — Clean Up Old Caches on Activate

```js
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_NAME) // Delete all caches except the current one
						.map((name) => caches.delete(name)),
				),
			)
			.then(() => self.clients.claim()), // Take control of all open tabs immediately
	);
});
```

### Step 4 — Fetch Strategy by Route

```js
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// 1. API calls → Network First with cache fallback
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(networkFirstStrategy(request));
		return;
	}

	// 2. Static assets (JS, CSS, fonts, images) → Cache First
	if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
		event.respondWith(cacheFirstStrategy(request));
		return;
	}

	// 3. Navigation requests (HTML pages) → Network First, fallback to /offline.html
	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
		return;
	}

	// 4. Everything else → Stale While Revalidate
	event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstStrategy(request) {
	try {
		const response = await fetch(request);
		const cache = await caches.open(CACHE_NAME);
		cache.put(request, response.clone());
		return response;
	} catch {
		return caches.match(request);
	}
}

async function cacheFirstStrategy(request) {
	const cached = await caches.match(request);
	return cached ?? fetch(request);
}

async function staleWhileRevalidate(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	const networkPromise = fetch(request).then((response) => {
		cache.put(request, response.clone());
		return response;
	});
	return cached ?? networkPromise;
}
```

### Step 5 — Web App Manifest

```json
// public/manifest.json
{
	"name": "Gold Invest — BharatPe",
	"short_name": "Gold",
	"description": "Buy and sell 24K digital gold, start a Gold SIP",
	"start_url": "/#/gold",
	"display": "standalone",
	"background_color": "#ffffff",
	"theme_color": "#007270",
	"orientation": "portrait-primary",
	"categories": ["finance"],
	"icons": [
		{ "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
		{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
		{ "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
	]
}
```

Link it in `index.html`:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#007270" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### Step 6 — Offline Fallback Page

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>No Connection — Gold Invest</title>
		<style>
			body {
				font-family: sans-serif;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}
			h1 {
				color: #007270;
			}
		</style>
	</head>
	<body>
		<h1>You're offline</h1>
		<p>Please check your connection and try again.</p>
		<button onclick="location.reload()">Retry</button>
	</body>
</html>
```

---

## Push Notifications

Push notifications let you re-engage users even when the browser tab is closed.

### Flow

```
1. User visits app
2. App requests notification permission
3. Browser creates a Push Subscription (endpoint + keys)
4. App sends subscription to your backend
5. Backend calls the Push Service (via web-push library) when needed
6. Push Service delivers message to user's browser
7. Service Worker receives 'push' event and shows the notification
```

### Code

```tsx
// src/hooks/usePushNotifications.ts
export async function subscribeToPush(): Promise<PushSubscription | null> {
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return null;

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
	});

	// Send subscription to your API
	await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(subscription),
	});

	return subscription;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
```

```js
// service-worker.js — receive push and show notification
self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	event.waitUntil(
		self.registration.showNotification(data.title ?? 'Gold Invest', {
			body: data.body ?? 'You have a new update.',
			icon: '/icons/icon-192.png',
			badge: '/icons/badge-72.png',
			data: { url: data.url ?? '/' },
		}),
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## Background Sync

Background Sync lets you defer actions until the user has a stable connection. Perfect for fintech: if a user submits a "Buy Gold" form while offline, the request is queued and replayed automatically when connectivity returns.

```js
// In the page (online or offline)
async function buyGoldWithSync(payload) {
	if ('serviceWorker' in navigator && 'SyncManager' in window) {
		const registration = await navigator.serviceWorker.ready;
		// Store payload in IndexedDB for the SW to read later
		await saveToIndexedDB('pending-buys', payload);
		await registration.sync.register('sync-gold-buy');
	} else {
		// Fallback: attempt immediately
		await fetch('/api/gold/buy', { method: 'POST', body: JSON.stringify(payload) });
	}
}

// service-worker.js
self.addEventListener('sync', (event) => {
	if (event.tag === 'sync-gold-buy') {
		event.waitUntil(replayPendingBuys());
	}
});

async function replayPendingBuys() {
	const pending = await readFromIndexedDB('pending-buys');
	for (const payload of pending) {
		await fetch('/api/gold/buy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		await removeFromIndexedDB('pending-buys', payload.id);
	}
}
```

---

## App Install Prompt (A2HS — Add to Home Screen)

The browser fires `beforeinstallprompt` before it shows its native install banner. You can intercept it and show your own custom install UI instead.

```tsx
// src/hooks/usePWAInstall.ts
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		const handler = (e: BeforeInstallPromptEvent) => {
			e.preventDefault(); // Stop the automatic banner
			setInstallPrompt(e); // Save it for later
		};

		window.addEventListener('beforeinstallprompt', handler as EventListener);
		window.addEventListener('appinstalled', () => setIsInstalled(true));

		return () => {
			window.removeEventListener('beforeinstallprompt', handler as EventListener);
		};
	}, []);

	const install = async () => {
		if (!installPrompt) return;
		await installPrompt.prompt();
		const { outcome } = await installPrompt.userChoice;
		if (outcome === 'accepted') setIsInstalled(true);
		setInstallPrompt(null);
	};

	return { canInstall: !!installPrompt, isInstalled, install };
}
```

```tsx
// Usage in a component
function InstallBanner() {
	const { canInstall, install } = usePWAInstall();

	if (!canInstall) return null;

	return (
		<div className="ib-flex ib-items-center ib-justify-between ib-bg-teal-700 ib-p-4">
			<Text className="ib-text-white">Add Gold Invest to your home screen</Text>
			<Button onClick={install} variant="outlined">
				Install
			</Button>
		</div>
	);
}
```

---

## Lighthouse PWA Audit

Lighthouse (built into Chrome DevTools) audits PWA compliance. Key checklist:

| Check            | Requirement                                  |
| ---------------- | -------------------------------------------- |
| HTTPS            | All resources served over HTTPS              |
| Service Worker   | Registered and controls the page             |
| Web App Manifest | Valid manifest linked in `<head>`            |
| Installable      | Meets all installability criteria            |
| Works offline    | 200 response when offline                    |
| Splash screen    | `name`, `background_color`, icon in manifest |
| Viewport meta    | `<meta name="viewport">` present             |
| Icons            | At least 192×192 and 512×512                 |
| Theme colour     | `theme_color` in manifest                    |

Run in terminal:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Audit your PWA
lighthouse https://your-app.com --view --output=html
```

---

## PWA with Vite (`vite-plugin-pwa`)

In practice, you rarely write a service worker from scratch. `vite-plugin-pwa` generates a production-ready SW using **Workbox** under the hood.

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate', // Auto-update SW when new version is detected
			injectRegister: 'auto', // Inject registration script automatically
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.example\.com\//,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							networkTimeoutSeconds: 10,
							expiration: { maxEntries: 50, maxAgeSeconds: 300 },
						},
					},
					{
						urlPattern: /^https:\/\/d30gqtvesfc1d5\.cloudfront\.net\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'cdn-cache',
							expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
						},
					},
				],
			},
			manifest: {
				name: 'Gold Invest',
				short_name: 'Gold',
				theme_color: '#007270',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
				],
			},
		}),
	],
});
```

---

## Update Flow — Handling New SW Versions

When you deploy a new version, the browser downloads the new SW. By default it waits until all tabs are closed before activating. Users might run the old version for days. Here's a pattern to prompt them to update:

```tsx
// src/hooks/useSWUpdate.ts
import { useEffect, useState } from 'react';

export function useSWUpdate() {
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
	const [showReload, setShowReload] = useState(false);

	useEffect(() => {
		if (!('serviceWorker' in navigator)) return;

		navigator.serviceWorker.ready.then((registration) => {
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				newWorker?.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						setWaitingWorker(newWorker);
						setShowReload(true);
					}
				});
			});
		});

		// Detect controller change (new SW activated) and reload
		let refreshing = false;
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (!refreshing) {
				refreshing = true;
				window.location.reload();
			}
		});
	}, []);

	const reloadPage = () => {
		waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
	};

	return { showReload, reloadPage };
}
```

```js
// service-worker.js — listen for SKIP_WAITING message
self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
```

---

## PWA vs Native App vs Regular Web App

| Feature               | Regular Web App | PWA         | Native App |
| --------------------- | --------------- | ----------- | ---------- |
| Offline support       | ❌              | ✅          | ✅         |
| Push notifications    | ❌              | ✅          | ✅         |
| Installable           | ❌              | ✅          | ✅         |
| App Store required    | ❌              | ❌          | ✅         |
| Background sync       | ❌              | ✅          | ✅         |
| Camera / Microphone   | Limited         | ✅          | ✅         |
| Bluetooth / NFC       | ❌              | Partial     | ✅         |
| Face ID / Touch ID    | ❌              | WebAuthn ✅ | ✅         |
| Performance ceiling   | Low             | Medium      | High       |
| SEO / discoverability | ✅              | ✅          | ❌         |
| One codebase          | ✅              | ✅          | ❌         |
| iOS Safari support    | ✅              | Partial     | ✅         |

### iOS Limitations (as of 2025)

Apple has improved iOS PWA support significantly but gaps remain:

- Push notifications: **Supported** from iOS 16.4+ (Web Push)
- Background Sync: **Not supported** (use periodic background sync via `setInterval` workaround)
- `beforeinstallprompt`: **Not supported** — you must guide users manually ("Share → Add to Home Screen")
- IndexedDB, Cache API: Fully supported
- Storage quota: Limited to ~50 MB by default (can be increased via Storage API)

---

## Interview Q&A

---

### Q1. What is a Progressive Web App and what makes it "progressive"?

**A:** A PWA is a web application that uses modern web capabilities to deliver an app-like experience. The "progressive" refers to **progressive enhancement** — the core functionality works on all browsers, and enhanced features (offline, push, install) are layered on top for capable browsers. A user on an old browser still gets a working website; a user on Chrome/Edge/Safari gets the full app experience.

---

### Q2. What is a Service Worker and how does it differ from a regular Web Worker?

**A:** Both run off the main thread in a separate JavaScript context.

|                    | Service Worker                                              | Web Worker                                    |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| Lifecycle          | Persists between page loads; survives page close            | Tied to the page's lifetime                   |
| Scope              | Intercepts network requests; runs independently of the page | Runs tasks for the page                       |
| Use case           | Caching, push notifications, background sync                | Heavy computation (image processing, parsing) |
| Registration       | `navigator.serviceWorker.register()`                        | `new Worker('./worker.js')`                   |
| Multiple instances | One per origin/scope                                        | One per `new Worker()` call                   |

Service Workers cannot access the DOM directly. They communicate with pages via the `postMessage` API.

---

### Q3. What caching strategies are available in a Service Worker and when do you use each?

**A:**

- **Cache First** — Assets that don't change (fonts, icons, versioned JS bundles). Maximum speed; no network cost.
- **Network First** — API endpoints where freshness matters but offline fallback is acceptable. Slower on bad networks.
- **Stale-While-Revalidate** — Content that can be slightly stale (news feed, product listings). Best of both: fast response + eventual freshness.
- **Cache Only** — Pre-cached assets during SW install; no network needed.
- **Network Only** — Analytics, write operations (POST/PUT/DELETE) that must not be served from cache.

---

### Q4. What is the `install` vs `activate` event in a Service Worker?

**A:**

- **`install`:** Fires when the browser downloads a new SW for the first time or when the SW file has changed. You pre-cache critical assets here with `event.waitUntil(cache.addAll([...]))`. Calling `self.skipWaiting()` inside install causes the SW to activate immediately instead of waiting.

- **`activate`:** Fires when the SW takes control. You clean up stale caches here — delete any cache keys that don't match the current version. Calling `self.clients.claim()` causes the newly activated SW to take control of all open tabs immediately without waiting for a reload.

---

### Q5. How do you handle SW updates without disrupting the user?

**A:** When a new SW is detected:

1. The browser downloads and installs the new SW (`installing` state).
2. The new SW enters `waiting` state — it can't activate yet because the old SW still controls open tabs.
3. You listen for `updatefound` and `statechange` events on the registration.
4. When the new SW is `installed`, show the user a toast: "Update available — click to refresh."
5. When the user clicks, `postMessage({ type: 'SKIP_WAITING' })` to the waiting SW.
6. The SW calls `self.skipWaiting()`, activates, and you listen for `controllerchange` on the page to trigger `window.location.reload()`.

---

### Q6. What is the Web App Manifest and what are the key fields?

**A:** A JSON file linked in `<head>` that describes the app to the browser for installation purposes.

Key fields:

- `name` / `short_name` — full and abbreviated app name
- `start_url` — URL opened when the app launches from home screen
- `display` — `standalone` (no browser chrome) is most common
- `icons` — array with at least 192×192 and 512×512 entries; `maskable` purpose for Android adaptive icons
- `theme_color` — status bar colour on Android
- `background_color` — splash screen background

---

### Q7. What is the difference between `skipWaiting` and `clients.claim()`?

**A:**

- **`self.skipWaiting()`** (called inside the SW) — forces the installing SW to skip the waiting phase and activate immediately, even if the old SW is still controlling pages.
- **`self.clients.claim()`** (called in the `activate` event) — makes the newly activated SW take control of all open tabs that fall within its scope immediately, without waiting for them to reload.

Together they ensure zero-wait SW updates but can cause a momentary mismatch if the page was loaded with the old SW's cached assets and a new SW immediately takes over.

---

### Q8. How does Push Notification work in PWAs?

**A:**

1. Page requests `Notification.requestPermission()`.
2. On grant, it subscribes via `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey })`.
3. The browser generates a unique **Push Subscription** (an endpoint URL + encryption keys) tied to this browser + user combo.
4. The app sends this subscription object to the backend.
5. When needed, the backend calls the **Push Service** (Google FCM, Mozilla, Apple) using the `web-push` library with the VAPID keys.
6. The Push Service delivers the message to the browser.
7. The browser wakes up the SW (even if the tab is closed) and fires a `push` event.
8. The SW calls `self.registration.showNotification(...)`.

---

### Q9. What is Background Sync and how is it useful in a fintech app?

**A:** Background Sync (`SyncManager`) lets you defer a network request until the user has a reliable connection. If a user submits a form while offline, you queue the payload in IndexedDB and register a sync tag (`registration.sync.register('sync-buy')`). When connectivity returns, the browser fires a `sync` event in the SW, which replays the request. If the request fails again, the browser retries with exponential backoff.

In a fintech context this is valuable for: investment order submissions, SIP setup forms, feedback forms, or preference updates that should never be silently dropped.

---

### Q10. How do you test and audit a PWA?

**A:**

- **Chrome DevTools → Application tab** — inspect manifest, service worker registration, cache storage contents, push subscriptions.
- **Lighthouse audit** — automated checklist covering PWA installability, performance (Core Web Vitals), accessibility, SEO.
- **Offline simulation** — DevTools → Network tab → "Offline" throttle; verify the app loads from cache.
- **`vite-plugin-pwa` devOptions** — set `devOptions.enabled: true` to test SW in development mode.
- **Manual install test** — load in Chrome on Android, verify "Add to Home Screen" prompt appears.
- **Push testing** — DevTools → Application → Service Workers → "Push" text field to simulate a push event without a real backend.

---

### Q11. Can a PWA access native device features?

**A:** Yes, through modern web APIs:

| Feature                         | API                                        |
| ------------------------------- | ------------------------------------------ |
| Camera / Microphone             | `MediaDevices.getUserMedia()`              |
| Geolocation                     | `Geolocation API`                          |
| Biometrics (Face ID / Touch ID) | `Web Authentication API (WebAuthn)`        |
| Clipboard                       | `Clipboard API`                            |
| Share sheet                     | `Web Share API`                            |
| File system                     | `File System Access API`                   |
| Contacts                        | `Contact Picker API`                       |
| Vibration                       | `Vibration API`                            |
| Bluetooth                       | `Web Bluetooth API` (Chrome only, not iOS) |
| Payment                         | `Payment Request API`                      |

Browser support varies. Bluetooth and NFC are not available on iOS Safari. Feature-detect before using.

---

### Q12. What is `workbox` and why do teams use it instead of writing SW code manually?

**A:** Workbox is a set of libraries (from Google) that abstract common SW patterns into configuration. Instead of writing `fetch` event handlers by hand, you declare caching strategies per URL pattern:

```js
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkFirst());
registerRoute(({ request }) => request.destination === 'image', new CacheFirst());
```

Benefits:

- Handles edge cases (cache expiry, opaque responses, range requests)
- Built-in `ExpirationPlugin`, `BackgroundSyncPlugin`, `BroadcastUpdatePlugin`
- `vite-plugin-pwa` generates Workbox config from your Vite config automatically
- Reduces boilerplate and avoids subtle bugs in cache management

---

### Q13. What is a `maskable` icon and why is it needed?

**A:** Android applies an **adaptive icon** mask (circle, squircle, or other shape depending on the launcher) to home screen icons. A standard icon may get clipped. A `maskable` icon has a safe zone (the central 80% of the icon area contains the important visual; the outer 20% is safe to be cropped). You add it to the manifest with `"purpose": "maskable"`. Tools like [maskable.app](https://maskable.app) let you preview how your icon looks under different masks.

---

### Q14. How is a PWA different from a regular SPA?

**A:** A Single Page Application (SPA) is an architecture pattern (client-side routing, JS-rendered UI). A PWA is a set of capabilities layered on top. An SPA can be a PWA, and a PWA is usually built as an SPA, but:

- An SPA with no service worker and no manifest is NOT a PWA.
- A PWA adds: offline support, installability, push notifications, background sync.
- The PWA layer is opt-in; you add it to an existing SPA by registering a service worker and adding a manifest.

---

### Q15. What security considerations are specific to PWAs?

**A:**

- **HTTPS is mandatory** — Service Workers can intercept all traffic; without TLS this is trivially exploitable.
- **VAPID keys for push** — Never expose your private VAPID key on the client. Only the public key goes to the browser.
- **Cache poisoning** — Be careful caching API responses that contain sensitive data. Use network-only for auth endpoints. Clear sensitive caches on logout.
- **SW scope** — A SW at `/app/sw.js` only controls routes under `/app/`. Put it at the root `/sw.js` unless you need restricted scope.
- **Cross-origin caching** — Responses to cross-origin requests are "opaque" (status 0). Don't cache opaque responses with `CacheFirst` — you can't tell if they failed and they consume storage.
- **Content Security Policy** — Set a strong CSP header. SW scripts must comply with the page's CSP.
