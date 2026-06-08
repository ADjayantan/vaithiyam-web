/**
 * Font Awesome configuration for Next.js SSR
 * Import this in layout.tsx or _app.tsx so the icon library
 * builds its CSS on the server and avoids the flash-of-unstyled-icons.
 */
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Tell Font Awesome to skip adding the CSS automatically
// since we're importing it above (prevents duplicate injection)
config.autoAddCss = false;
