
## Plan: Consolidate to single-page light-theme dashboard

### 1. Theme — Light mode
Rewrite `:root` tokens in `src/styles.css` to a clean light palette (white background, slate foreground, soft borders, primary blue). Keep semantic tokens (success/warning/destructive/info) but tuned for light surfaces. No dark variant needed.

### 2. Single page consolidation
- Collapse to one route: `/` (Overview). Delete `src/routes/work-queue.tsx`, `src/routes/performance.tsx`, `src/routes/area-map.tsx`.
- Remove sidebar nav entirely (or strip to brand-only header). Simplify `DashboardLayout` — no sidebar.
- Move **Insurer / Provider view switcher** to the top of the Overview page (prominent segmented control as page header, not in TopBar).
- TopBar: remove search box, keep entity dropdown + date filter only.

### 3. KPI row changes
- Remove **Avg SLA** KPI card.
- Remove **Work Queue** route; replace with a **"Work Queue Monitor"** KPI card showing count of items needing handling (pending + need-doc + SLA-risk number).
- Add **"Needs Attention"** panel/card with signals:
  - Claim spike (today vs 7-day avg)
  - SLA exceeded count
  - Rejection rate jump
  - Aging >7d count
  Each as a colored alert tile with count + short label.

### 4. Page sections (single scroll page, top → bottom)
1. **View switcher header** (Insurer | Provider) + entity dropdown + date range
2. **KPI row** (Total Claims, Total Payable, Pending, Rejected, Work Queue Monitor)
3. **Needs Attention** panel (4 alert tiles)
4. **Claim Trend** chart + **Status Breakdown** donut
5. **SLA Aging Buckets** + **Top Providers/Insurers** ranking
6. **Thailand Area Map** (with region + province filters)
7. **Financial Snapshot**

### 5. Thailand map (real geographic SVG)
Replace the abstract grid heatmap in current `area-map.tsx` with an inline SVG map of Thailand provinces (choropleth). 
- Use a lightweight inline SVG of Thailand's 77 provinces (bundled as a static asset under `src/assets/thailand-provinces.svg` or as a TS module with path data). Fetch a public-domain simplified GeoJSON/SVG (e.g., from Wikimedia) and convert to inline SVG paths keyed by province code.
- **Region filter** (segmented control): All / Central / North / Northeast / East / West / South — filters which provinces are highlighted/visible.
- **Province filter** (searchable dropdown): pick a single province to zoom/focus and show its drill-down panel.
- Color provinces by the selected metric (claims / payable / pending) using `--primary` opacity scale.
- Click a province → updates the side detail panel (existing logic).
- Expand `provinceData` in `mock-data.ts` to cover more Thai provinces and tag each with `region: "central" | "north" | "northeast" | "east" | "west" | "south"`.

### Technical notes
- Use `react-simple-maps` or hand-rolled inline SVG. Recommend **inline SVG** (no extra dep, no external fetch at runtime) — store paths in `src/lib/thailand-geo.ts`.
- Light-theme chart colors will be re-derived from the new tokens; Recharts already reads `var(--color-*)`.
- `view-store` and mock data shapes stay the same; only `provinceData` gains a `region` field and more rows.

### Files touched
- `src/styles.css` — light palette
- `src/components/dashboard/layout.tsx` — remove sidebar
- `src/components/dashboard/top-bar.tsx` — drop search, drop view-switcher (moved into page)
- `src/components/dashboard/sidebar.tsx` — delete
- `src/routes/index.tsx` — full rewrite: switcher header + all sections merged
- `src/routes/work-queue.tsx`, `performance.tsx`, `area-map.tsx` — delete
- `src/lib/mock-data.ts` — add region tags, more provinces, attention signals
- `src/lib/thailand-geo.ts` — new, inline SVG path data per province
- `src/components/dashboard/thailand-map.tsx` — new, the choropleth + filters component
