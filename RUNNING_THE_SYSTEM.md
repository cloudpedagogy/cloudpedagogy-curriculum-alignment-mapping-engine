# Running the Curriculum Alignment & Mapping Engine (CAME)

This guide provides instructions for setting up, developing, testing, and building CAME locally.

---

## 📋 Prerequisites

Before running CAME, ensure you have the following installed:

- **Node.js**: `v18.0.0` or later (LTS recommended)
- **npm**: `v9.0.0` or later
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge

Verify your installed versions:
```bash
node --version
npm --version
```

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/cloudpedagogy/cloudpedagogy-curriculum-alignment-mapping-engine.git
cd cloudpedagogy-curriculum-alignment-mapping-engine
npm install
```

---

## 💻 Development Server

To launch the local development environment with Hot Module Replacement (HMR):

```bash
npm run dev
```

By default, the Vite dev server starts at:
```
http://localhost:5173/
```

Navigate to this address in your web browser. Any changes made to source files will update instantly in the browser.

---

## 🧪 Running Automated Tests

CAME includes an automated test suite with 42 tests covering:
- Relationship authoring and validation
- Prerequisite direct and transitive cycle detection
- Duplicate relationship prevention
- Safe deletion cascades and referential integrity
- Shared-outcome preservation logic
- Diagnostic separation (technical data errors vs educational observations)
- JSON import/export round-trip fidelity

Run the automated tests using Node's native test runner:

```bash
npm test
```

To run a specific test suite directly:
```bash
node --test --experimental-strip-types "src/lib/data/__tests__/relationshipAuthoring.test.ts"
```

---

## 🔍 Code Linting

To check source files for TypeScript and React conventions using ESLint:

```bash
npm run lint
```

---

## 🏗️ Production Build

To compile TypeScript and generate the optimized, static production bundle:

```bash
npm run build
```

This compiles TypeScript definitions (`tsc -b`) and bundles client assets via Vite into the `dist/` directory.

### Previewing the Production Build

You can preview the built static bundle using Vite's built-in preview server:
```bash
npm run preview
```

Alternatively, you can serve the `dist/` folder using Python's built-in HTTP server:
```bash
python3 -m http.server 8000 --directory dist
```
Then visit `http://localhost:8000/`.

---

## 🌐 Static Deployment

CAME is a zero-backend, pure client-side application. The compiled `dist/` directory can be deployed directly to any static web hosting provider, including:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- AWS S3 / CloudFront
- Nginx / Apache static hosting

No backend services, database migrations, or server-side environment variables are required.
