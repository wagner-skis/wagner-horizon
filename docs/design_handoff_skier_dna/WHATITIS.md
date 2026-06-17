# Skier DNA — What It Is

## Overview

Skier DNA is a multi-step interactive ski configurator embedded directly in the Wagner site. A prospective customer answers a short series of questions about where and how they ski, and the feature builds a real-time visual ski recommendation tailored to them — ending in a shareable design and a call-to-action to book a consultation with the Wagner team.

---

## The Five Steps

**Step 1 — Hello**
Collects the customer's first name and email address.

**Step 2 — Where & When**
The customer picks up to three ski regions, one or more day types (powder, everyday, hard/firm, touring), and up to three terrain types (groomed, moguls, bowls, trees, etc.).

**Step 3 — Feel**
A stability vs. weight slider sets the character of the build. The customer also enters their current ski (brand, model, year, length) with free-text fields for what they like and where it falls short, plus their binding type.

**Step 4 — You**
Height, weight, age (optional), boot sole length (optional), skier ability level (I through III+), and a free-text notes field for injuries, goals, or anything else.

**Step 5 — Your Design**
Shows the computed ski specification alongside three "ride personalities" to choose from. The customer can then adjust length, waist width, and camber with live sliders, browse topsheet graphics, and either book a design call or email themselves the design.

A live SVG ski diagram updates throughout all five steps — shape, rocker profile, material layers, and a to-scale body silhouette change in real time as answers are entered.

---

## AI Integration

When the customer completes Step 4 and transitions to Step 5, the site calls a Cloudflare Worker that hits Claude Haiku (Anthropic's fast AI model). It sends the full skier profile — regions, day types, terrain, stability preference, height and weight, ability level, notes, and the specific material combinations selected for each personality — and receives back three AI-generated name, tagline, and description sets, one per ride personality.

These replace the static fallback copy and appear while loading with skeleton placeholders. If the AI endpoint is not configured or the request fails for any reason, the section silently falls back to hardcoded copy — the customer never sees an error.

---

## Data Storage

**Browser (localStorage)** — All in-progress state is saved locally for 30 days. Returning visitors automatically resume where they left off, with a "Welcome back" banner.

**Design save API** — When a customer clicks "Email me this design," their full state and computed spec are sent to a Cloudflare backend at `/api/designs`. The API returns a unique design ID that can be used to reopen the exact design via a URL link in the confirmation email. (This backend is built but not yet live — in the interim, a "we'll be in touch" confirmation is shown.)

**Shopify customer metafields** — For logged-in customers, previously saved designs are read from Shopify at page load and shown in a "Your saved designs" picker so they can pick up a prior design or start a new one.

**CRM sync** — On every step transition, a silent background request syncs the current state to the backend for CRM and analytics use.

**Klaviyo** — An opt-in checkbox on the save modal adds the customer to the configured Klaviyo list. The list ID is set in the theme editor.

---

## What's Configurable in the Theme Editor

**Copy** — All headline text, subheads, prompts, and button labels are editable without touching code.

**Question options (Blocks)**
- Regions — label and stable value key
- Day type cards — label, value, and an optional image
- Terrain cards — label, value, and an optional image
- Package tiers — name, blurb, and a detail page link
- Graphic categories — name and the Shopify collection that supplies the topsheet images

**Behavior**
- Show or hide the recommended package tag in Step 5
- Show or hide the true-scale body silhouette in Step 4
- Card corner radius (0–24 px)
- Color scheme

**Button styles** — Continue/CTA buttons, Back/navigation buttons, and secondary CTAs are each independently configurable as Theme Primary, Theme Secondary, or Text Link.

**Integrations**
- Calendly event URL — embedded as an iframe in the "Book a call" dialog
- Klaviyo list ID
- Topsheet graphics collection
- AI personalities endpoint URL (Cloudflare Worker → Claude Haiku)
- Worker auth token
- Design save API base URL

---

## How It's Built

Skier DNA is a vanilla JavaScript custom element with no framework and no build step — it loads as a standard ES module alongside the rest of the theme. All question content (regions, terrain options, materials, saved designs) is serialized to JSON by Shopify's Liquid templating at page render time and handed to the JavaScript as an embedded JSON block, so nothing is hardcoded in the JS.

The ski diagram is generated entirely in JavaScript as an SVG — no image files. Shape, rocker, camber, and material layer indicators are all driven by math from the customer's answers.

The material library lives in Shopify as a custom metaobject (`material_library`). Each material has numeric performance factors (damp, flex, speed, weight), and the JS picks the best-fit material for each personality using a nearest-neighbor distance calculation across those factors.

Analytics events fire to Google Analytics 4 and the dataLayer on step transitions, personality selections, and design saves.
