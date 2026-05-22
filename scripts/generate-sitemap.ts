// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.yaidev.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

// Single-page site with in-page section anchors
const entries: SitemapEntry[] = [
  { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
  { path: "/#about", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/#products", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/#services", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/#team", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/#projects", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/#build-now", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/#contact", lastmod: today, changefreq: "monthly", priority: "0.7" },
];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
