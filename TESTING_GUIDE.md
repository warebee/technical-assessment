# Testing Guide - SQL Assessment App

## Quick Test (2 minutes)

### 1. Start the dev server

```bash
bun dev
```

Open http://localhost:3000

### 2. Enable Debug Panel

Click the 🐛 bug icon in the header (next to "SQL Technical Assessment")

The debug panel shows:
- Current state (candidateInfo, answers, etc.)
- Whether data is saved in localStorage
- What tab you're on

### 3. Test State Persistence

**Step 1: Fill info and start**
1. Enter name: "Test User"
2. Enter email: "test@example.com"
3. Click "Start Assessment"
4. You'll be on "Test Datasets" tab
5. Check debug panel - should show:
   - `"candidateInfo": { "name": "Test User", ...}`
   - `"savedInLS": true`

**Step 2: Answer questions**
1. Go to "Questionnaire" tab
2. Answer question A1 (type anything)
3. Watch the debug panel update
4. Console should log: `"Saving state: {...}"`

**Step 3: Reload page** 🔄
1. Press **F5** or **Cmd+R** to refresh
2. Console should show: `"Loading saved state: found"`
3. You should be back on "Questionnaire" tab ✅
4. Question A1 should have your answer ✅
5. Your name should still be "Test User" ✅

**If this works, state persistence is working! ✅**

### 4. Test Submission

**Step 1: Complete some answers**
1. Answer a few questions (at least one)
2. Make sure your name and email are filled

**Step 2: Submit**
1. Click green "Submit" button in header
2. Watch browser console (F12)

**Expected outcomes:**

✅ **Success (development mode):**
```
Submitting: {...}
========== ASSESSMENT SUBMISSION ==========
[Formatted email body]
========== JSON DATA ==========
[JSON data]
===========================================
Submission result: { success: true, method: 'console', ... }
```

You'll see the success screen showing:
- "Assessment Submitted!"
- Time taken
- Questions answered %

❌ **If it fails:**
Console will show the actual error. Common issues:
- Network error
- Email service not configured (should work in dev mode)

## Debugging State Issues

### Check localStorage manually

In browser console (F12):
```javascript
// See what's saved
console.log(localStorage.getItem('sql_assessment_state'));

// Parse it
console.log(JSON.parse(localStorage.getItem('sql_assessment_state')));

// Clear it
localStorage.removeItem('sql_assessment_state');
location.reload();
```

### Watch console logs

When you type in a field, you should see:
```
Saving state: {
  candidateInfo: { name: "Test User", email: "test@example.com", ... },
  answers: { A1: "My answer here" },
  startTime: 1706364123456,
  currentSection: "A",
  activeTab: "questions"
}
```

### Check the debug panel

Click 🐛 in header. It shows:
- Real-time state
- Whether localStorage has data
- Current tab and section

## Common Issues & Fixes

### Issue 1: State not saving after reload

**Symptoms:**
- Fill in info, reload → back to empty form
- Answer questions, reload → answers gone

**Debug:**
1. Open console before starting
2. Fill in name/email
3. Check console - do you see `"Saving state: ..."`?
   - **No logs** → isLoaded might be false. Reload and check again.
   - **Logs appear** → Check localStorage in console: `localStorage.getItem('sql_assessment_state')`

**Fix:**
```javascript
// In console, check if data is actually saved
localStorage.getItem('sql_assessment_state')

// Should return a JSON string with your data
// If it returns null, state is not being saved
```

### Issue 2: Submission fails

**Symptoms:**
- Click Submit → "Submission failed" alert
- Console shows error

**Debug:**
1. Check console for error details
2. Common errors:
   - `"No email service configured"` → Need to set up Resend or use dev mode
   - `"Network error"` → Check if dev server is running
   - `500 error` → Check API logs in terminal

**Fix for local testing:**
Make sure `.env.local` has:
```
NODE_ENV=development
```

This allows submissions without email service (logs to console instead).

### Issue 3: Returns to wrong tab after reload

**Symptoms:**
- On Questionnaire tab, reload → back to Getting Started

**Debug:**
1. Check debug panel before reload - does it show correct `activeTab`?
2. After reload, check console: does it say `"Loading saved state: found"`?

**Fix:**
The `activeTab` should be in localStorage. Check in console:
```javascript
JSON.parse(localStorage.getItem('sql_assessment_state')).activeTab
// Should return: "questions" or "datasets" or "info"
```

## Production Testing

To test like production (email service required):

```bash
# 1. Create .env.local with real Resend key
echo "RESEND_API_KEY=re_your_key_here" > .env.local
echo "RESEND_FROM_EMAIL=work@warebee.com" >> .env.local

# 2. Build and start
bun run build
bun start

# 3. Test submission - should actually send email
```

## What Gets Saved

Every time you type or change something, these get saved to localStorage:

- ✅ `candidateInfo.name`
- ✅ `candidateInfo.email`
- ✅ `candidateInfo.position`
- ✅ `candidateInfo.timeLimit`
- ✅ `startTime` (when you clicked "Start Assessment")
- ✅ `answers` (every question answer)
- ✅ `currentSection` (A, B, C, D, or E)
- ✅ `activeTab` (info, datasets, or questions)

## Auto-Save Indicator

When state saves successfully, you'll see:
- Green "Auto-saved ✓" in the header
- Console log: `"Saving state: {...}"`

## Clear Progress Button

If you need to start fresh:
1. Go to "Getting Started" tab
2. Scroll to bottom
3. Click "Clear All Progress & Start Fresh"
4. Confirm → page reloads with clean state

## Expected Console Output

### On page load (with saved state):
```
Loading saved state: found
Parsed state: { candidateInfo: {...}, answers: {...}, ... }
```

### When typing/changing:
```
Saving state: { candidateInfo: {...}, answers: {...}, ... }
```

### On submission:
```
Submitting: {...}
========== ASSESSMENT SUBMISSION ==========
...email content...
Submission result: { success: true, method: 'console' }
```

## Success Criteria

✅ State persists across page refreshes
✅ Debug panel shows correct data
✅ Console logs show save/load operations
✅ Submission works (logs to console in dev mode)
✅ Returns to correct tab after reload
✅ All answers preserved after reload

If all these work, the app is ready to deploy! 🚀
