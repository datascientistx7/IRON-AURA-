# Firebase Security Rules Setup Guide

## ⚠️ Permission Denied Error Fix

If you're getting a "Permission denied" error when placing orders, you need to update your Firestore security rules.

### Steps to Fix:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **IRON AURA** (iron-aura-a8c59)

2. **Navigate to Firestore Rules**
   - Click on **Firestore Database** in the left sidebar
   - Click on the **Rules** tab (next to "Data" tab)

3. **Copy and Paste These Rules**

   Replace the existing rules with this code:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       
       // Customers Collection - Allow read/write for all
       match /customers/{customerId} {
         allow read, write: if true;
       }
       
       // Orders Collection - Allow read/write for all
       match /orders/{orderId} {
         allow read, write: if true;
       }
       
       // Default: Deny all other access
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **Publish the Rules**
   - Click the **Publish** button at the top
   - Wait for confirmation that rules have been published

5. **Test Again**
   - Go back to your website
   - Try placing an order again
   - It should work now! ✅

---

## 🔒 Production Security Rules (Recommended for Later)

For production, you should use more restrictive rules. Here's a safer version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only allow creation (not updates/deletes) from client
    match /customers/{customerId} {
      allow create: if request.resource.data.keys().hasAll(['name', 'phone', 'email', 'address', 'createdAt']);
      allow read: if false; // Only admins can read
    }
    
    match /orders/{orderId} {
      allow create: if request.resource.data.keys().hasAll(['customerId', 'customerName', 'items', 'totalAmount', 'status', 'createdAt']);
      allow read: if false; // Only admins can read
      allow update: if false; // Only admins can update
    }
  }
}
```

**Note:** The production rules require authentication and admin access for reading/updating. For now, use the first set of rules to get your orders working!

---

## Quick Copy-Paste Rules (Current Setup)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /customers/{customerId} {
      allow read, write: if true;
    }
    match /orders/{orderId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

