# Optional SPA deep-link fallback for GitHub Pages.
# After `npm run build`, copy dist/index.html → dist/404.html (or add a Vite plugin).
# Enable when client routes must survive a hard refresh on project/user Pages.
#
# Example (add to package.json scripts):
#   "postbuild": "node -e \"require('fs').copyFileSync('dist/index.html','dist/404.html')\""
#
# Not enabled by default so the minimal CRUD scaffold stays honest about routing needs.
