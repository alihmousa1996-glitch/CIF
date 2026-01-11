# 🔥 FINAL FIREBASE SETUP STEPS

## ✅ Your Config is Ready!

I've updated the app-firebase.js file with your real Firebase configuration.

---

## 🎯 **Next Steps (5 minutes):**

### **Step 1: Set Up Firebase Database**

1. Go to: https://console.firebase.google.com/
2. Open your project: **cif-canada-tracker**
3. In left menu, click: **Build** → **Realtime Database**
4. If you see "Create Database" button:
   - Click it
   - Choose location: **United States (us-central1)** (closest to you)
   - Select: **Start in test mode** (for now)
   - Click **Enable**

### **Step 2: Set Database Rules**

1. Once database is created, click **Rules** tab
2. You'll see something like:
```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

3. **Replace with this** (allows everyone to read/write):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. Click **Publish**

⚠️ **Security Note:** These rules allow anyone to read/write. For production, you should add authentication. But this works fine for your internal company use.

---

## 📥 **Step 3: Upload Files to GitHub**

Upload these 3 files to your GitHub Pages:

1. ✅ **index.html** (redirect page)
2. ✅ **tracker.html** (main app)
3. ✅ **app-firebase.js** (with your Firebase config!)

**Important:** Make sure to rename the file:
- Upload as: `app.js` (not app-firebase.js)
- OR update tracker.html to load `app-firebase.js`

I'll create a version with correct naming...
