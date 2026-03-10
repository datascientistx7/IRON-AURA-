# IRON AURA - Implementation Plan

## 1. Project Vision
A premium fitness & supplements website focusing on "Real Food. Real Gains." with a streamlined order and auth flow, powered by Firebase.

## 2. Tech Stack Setup
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Backend/Storage**: Firebase Firestore (Orders), Firebase Auth (User Authentication)
- **Assets**: Static assets served via Python dev server (locally)

## 3. High-Level Architecture
Browser -> Firebase Firestore (Data Persistence)

## 4. Progress Tracker

### Phase 1: Core Website (Completed)
- [x] Define Project Structure
- [x] Create HTML Pages (Index, Products, About)
- [x] Implement Premium Design System (AncientPotency aesthetic)

### Phase 2: E-commerce Logic (In Progress)
- [x] Shopping Cart with LocalStorage persistence
- [/] Checkout with Firebase Firestore data capture
- [x] "Alpha" Order Confirmation with Motivational Quotes

### Phase 4: Backend Transition (In Progress)
- [ ] Replace MySQL/Twilio references with Firebase SDK
- [ ] Configure `firebase-config.js` with project credentials

## 5. Configuration Needed from User
- **Firebase Project Credentials**: apiKey, authDomain, projectId, etc. (To be updated in `public/firebase-config.js`)

## 6. Verification Plan
### Manual Verification
1.  **Firebase Setup**: Ensure Firestore is initialized in the Firebase console.
2.  **Auth Test**: Register a new user and verify they appear in the Firebase Auth tab.
3.  **Order Test**: Place an order and verify a new document appears in the `orders` collection in Firestore.
4.  **UI Feedback**: Confirm the "Alpha" confirmation screen still appears after success.
