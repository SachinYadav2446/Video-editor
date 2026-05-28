# Creatify — Unified Web-Native Creative Suite

Creatify is a professional, high-performance browser-native design suite that unites 8 fully functional creative applications into a single unified workspace. Built with a cohesive modern aesthetic, dark-mode glassmorphic layouts, and an Express-powered PostgreSQL sync server.

---

## 🎨 Creative Studios Included

1. **🎬 Video Editor**
   * Multi-track timeline sequencing with dynamic scaling.
   * Play/pause previews, precise time scrubbing, and item duration sliders.
   * Split, duplicate, delete tracks, and adjust colors with active styling filters.

2. **🖼️ Image Editor**
   * Dynamic canvas workspace supporting layered element structures.
   * Interactive drag-and-drop movements, layer ordering, and select bounding boxes.
   * Comprehensive sidebar controls for typography, sizing, positioning, and transparency.

3. **📐 Logo Maker**
   * High-fidelity SVG vector design system.
   * Preset shapes (badge, hexagon, shield, ring, star) with real-time scaling and color options.
   * Checkered transparent workspace preview.
   * Exportable as raw XML SVG or high-resolution PNG (1200x1200px) with canvas outlines stripped.

4. **📱 Social Studio**
   * Multi-aspect ratio preview grid showing assets in Instagram (1:1), Stories/Reels (9:16), YouTube (16:9), and Facebook (16:5) ratios simultaneously.
   * 3D-styled interactive smartphone mockup feed simulator.
   * Scheduled campaign publisher calendar.

5. **📝 Documents Studio**
   * Modular block editor ( Notion-style) for headings, lists, blockquotes, and tables.
   * Interactive data tables with column/row builders.
   * Dynamic vector SVG charts (Bar & Line) linked directly to active spreadsheet columns that redraw on-the-fly.

6. **🖨️ Print Design Studio**
   * Dimension setups for letter templates (A4, Letter) and corporate business cards.
   * Solid crop guides and red 3mm bleed margin overlays.
   * CMYK ink-profile color space simulator.

7. **📊 Presentation Creator**
   * Multi-slide builder with editable markdown text.
   * Pre-designed styling themes (Warm Amber, Glassmorphism, Clean Minimal, Cyberpunk Glow).
   * Interactive fullscreen presenter mode.

8. **👤 Profile & Settings**
   * Unified user management including secure passwords and profile avatars.
   * Workspace tier and feature usage metrics.

---

## ⚡ Tech Stack

* **Frontend**: React 18, Vite, Custom HSL Vanilla CSS Design System, Lucide React, HTML5 Canvas, SVG engines, 3D CSS transforms.
* **Backend**: Node.js, Express, JWT Auth, Bcrypt.js, CORS.
* **Database**: PostgreSQL (Neon Database connected via Serverless WebSockets on port 443).

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Backend Setup
1. Open the project root directory and navigate to `server`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add the following variables:
   ```env
   PORT=3001
   JWT_SECRET=your_super_secret_jwt_key
   DATABASE_URL=your_postgres_or_neon_connection_string
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *(Note: The server will automatically connect to PostgreSQL/Neon and initialize the necessary database schemas. If no `DATABASE_URL` is set, it will gracefully fallback to a local JSON file store `server/users.json`).*

### 3. Frontend Setup
1. Go back to the project root directory:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.

---

## 🚀 Production Deployment on Render

This project contains a [render.yaml](render.yaml) file configured to build and link both services automatically.

### Option A: Automatic Deployment (Blueprint)
1. Go to your **Render Dashboard** -> **New** -> **Blueprint**.
2. Connect your GitHub repository.
3. Click **Apply** to automatically deploy the frontend Static Site and backend Web Service with all routing established.

### Option B: Manual Deployment
* **Backend (Web Service)**:
  * **Root Directory**: `server`
  * **Build Command**: `npm install`
  * **Start Command**: `npm start`
  * **Env Variables**: Add your `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` (points to the frontend URL).
* **Frontend (Static Site)**:
  * **Root Directory**: *Leave blank*
  * **Build Command**: `npm install && npm run build`
  * **Publish Directory**: `dist`
  * **Env Variables**: Add `VITE_API_URL` pointing to the deployed backend domain.
