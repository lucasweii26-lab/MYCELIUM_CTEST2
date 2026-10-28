import { defineConfig } from "vite";
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const classicScripts = ["region-paths.js", "app.js", "script.js", "hero-sequence.js", "feature-details.js", "scroll-indicator.js", "scroll-story.js", "gallery.js", "gallery-seed.js", "live-news.js", "air-quality.js", "swipe-nav.js", "footer-actions.js", "loading-reveal.js", "smooth-scroll.js", "text-protection.js", "language-picker.js", "volunteer-strip.js", "chat-orb.js"];

const copyClassicScripts = {
  name: "copy-classic-scripts-to-publish-directory",
  apply: "build",
  closeBundle() {
    const outputDirectory = path.resolve(projectRoot, "dist");
    mkdirSync(outputDirectory, { recursive: true });
    for (const filename of classicScripts) {
      copyFileSync(
        path.resolve(projectRoot, filename),
        path.join(outputDirectory, filename),
      );
    }
    // publicDir is disabled, so root-level static files must be copied explicitly.
    for (const filename of ["robots.txt"]) {
      const source = path.resolve(projectRoot, filename);
      if (existsSync(source)) copyFileSync(source, path.join(outputDirectory, filename));
    }
    // Gallery photos are referenced by root-relative paths (/img/gallery/...), also stored in Firestore.
    const galleryImages = path.resolve(projectRoot, "img/gallery");
    if (existsSync(galleryImages)) {
      cpSync(galleryImages, path.join(outputDirectory, "img/gallery"), { recursive: true });
    }
    // Facility photos are chosen at runtime (img/Facilities/<id>.jpg), so Vite cannot see them.
    const facilityPhotos = path.resolve(projectRoot, "img/Facilities");
    if (existsSync(facilityPhotos)) {
      cpSync(facilityPhotos, path.join(outputDirectory, "img/Facilities"), { recursive: true });
    }
    // Hero sequences and language packs are fetched at runtime, so Vite cannot see them.
    // (hero-depth is gone: the depth effect was removed.)
    for (const directoryName of ["hero-frames", "hero-frames-large", "hero-wire", "locales"]) {
      const sourceDirectory = path.resolve(projectRoot, directoryName);
      if (existsSync(sourceDirectory)) {
        cpSync(sourceDirectory, path.join(outputDirectory, directoryName), { recursive: true });
      }
    }
  },
};

export default defineConfig({
  root: ".",
  plugins: [copyClassicScripts],
  publicDir: false,
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: path.resolve(projectRoot, "index.html"),
        admin: path.resolve(projectRoot, "admin/index.html")
      },
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/") || id.includes("\\node_modules\\three\\")) {
            return "three";
          }
        }
      }
    }
  }
});