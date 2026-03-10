# IRON-AURA-
🧬 IRON AURA Real Food. Real Gains. IRON AURA is built for those who believe strength is earned — not faked. We create natural, clean, and honest supplements designed to fuel real performance, real recovery, and real results. No shortcuts. No synthetic hype. Just nutrition that works.

## Background

Hardcore, golden-era inspired landing site for the IRON AURA Hybrid Power supplement. Includes responsive front-end and Firebase Firestore persistence.

### Stack
- Firebase Firestore (Database)
- Vanilla HTML/CSS/JS (Served statically)

### Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure Firebase**
   - Open `public/firebase-config.js`.
   - Replace placeholder credentials with your Firebase project keys.
3. **Run the dev server**
   ```bash
   npm run dev
   ```
Visit `http://localhost:3000`.

### Data Flow
- **Orders**: Captured via the checkout form and stored in the `orders` collection in Firestore.

### Front-end Notes
- All static assets live in `public/assets`.
- Typography uses Google Fonts (Cinzel, Oswald, Roboto Condensed).
- Smooth scroll, parallax hero, reveal animations, and responsive layout built with CSS + IntersectionObserver.

### Deployment
1. Set up a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable Firestore and Firebase Auth.
3. Deploy static files to Firebase Hosting or any static host.
