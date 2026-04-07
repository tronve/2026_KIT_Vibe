# DEMO_MODE Quick Reference

## ⚡ Quick Start (60 seconds)

### 1. Enable DEMO_MODE
```bash
echo VITE_DEMO_MODE=true > .env.local
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Check Console
Look for: `[DEMO_MODE] App is running in demo mode with mock data...`

**Done!** Your app now runs with mock data instead of real APIs.

---

## 🔄 Common Workflows

### 🧪 Test with Mock Data
```bash
VITE_DEMO_MODE=true npm run dev
```
Then visit: `http://localhost:5173`

### 🌐 Test with Real Backend
```bash
VITE_DEMO_MODE=false VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run dev
```

### 🔗 Enable via URL Parameter
Open browser to: `http://localhost:5173/?demo=true`

### 📦 Build with Demo Mode
```bash
VITE_DEMO_MODE=true npm run build
```

---

## 📁 Mock Files Location

All mock implementations are in `src/mocks/`:

| File | Purpose |
|------|---------|
| `demoMode.ts` | Detects if DEMO_MODE is enabled |
| `mockData.ts` | Mock response generators |
| `apiMiddleware.ts` | Routes requests to mocks |
| `index.ts` | Exports all mocks |

---

## 🎮 Customize Mock Data

Edit `src/mocks/mockData.ts`:

```typescript
// Example: Change presentation analysis metrics
export function generateMockPresentationAnalyzeResponse() {
  return {
    session_id: 'session_custom_' + Date.now(),
    script: 'YOUR CUSTOM SCRIPT HERE',
    analysis_result: {
      wpm: 140,              // Words per minute
      filler_words_count: 2, // Filler words
      gaze_score: 95,        // Gaze quality (0-100)
      logic_summary: 'YOUR CUSTOM FEEDBACK',
    },
  }
}
```

---

## 🐛 Troubleshooting

### ❌ Console Error: "No mock implementation for..."
**Cause**: API endpoint doesn't have a mock
**Solution**: 
1. Check endpoint is in `apiMiddleware.ts`
2. Add mock function in `mockData.ts`
3. Or disable DEMO_MODE: `VITE_DEMO_MODE=false`

### ❌ Not Seeing "[DEMO_MODE]" Console Message
**Cause**: DEMO_MODE is disabled
**Solution**:
1. Set `VITE_DEMO_MODE=true` in `.env.local`
2. Restart dev server: `npm run dev`

### ❌ Getting Real API Errors
**Cause**: DEMO_MODE is disabled or mocks not working
**Solution**: 
1. Open DevTools Console
2. Type: `import { isDemoMode } from './src/mocks'; isDemoMode()`
3. Should return `true` if DEMO_MODE is enabled

---

## 🔗 Environment Variables

```bash
# In .env or .env.local

# Enable DEMO_MODE (defaults to false)
VITE_DEMO_MODE=true

# Real API base URL (used when DEMO_MODE=false)
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📊 Mocked Endpoints

✅ `POST /presentation/analyze` - Upload and analyze presentation video
✅ `POST /roleplay/start` - Start AI Q&A session  
✅ `POST /roleplay/turn` - Send answer, get follow-up question
✅ `POST /report/generate` - Generate comprehensive feedback report
✅ `DELETE /session/cleanup` - Clean up session data

---

## 💡 Pro Tips

1. **Use mocks during early UI development** - No backend needed
2. **Test loading states** - Mocks include realistic 200-1000ms delays
3. **Mock data is stateful** - Q&A responses cycle through 3 variations
4. **Replace mock audio** - Update `MOCK_AUDIO_BASE64` with real TTS audio
5. **Keep mocks synced** - Update when `api-spec.md` changes

---

## 📚 Full Documentation

See **`DEMO_MODE.md`** for:
- Detailed architecture explanation
- How to customize network delays
- Best practices
- Full troubleshooting guide

See **`DEMO_MODE_IMPLEMENTATION.md`** for:
- Complete implementation summary
- File descriptions
- Build verification results
- Next steps

---

## ✅ Verification Checklist

- [x] Mock data created and matches `api-spec.md`
- [x] DEMO_MODE detection working (env + URL parameter)
- [x] API client routing to mocks when enabled
- [x] Network delay simulation implemented
- [x] TypeScript types fully typed
- [x] Project builds successfully
- [x] Console logging working
- [x] Documentation complete

**Status**: Ready for development! 🚀

