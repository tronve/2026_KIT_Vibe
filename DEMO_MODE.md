# DEMO_MODE Implementation Guide

## Overview

DEMO_MODE is a development feature that allows the application to run with mock data without requiring a backend server. This enables developers and testers to work on the UI and frontend logic independently.

## Features

- ✅ **Zero Backend Dependency**: Run the app without a backend server
- ✅ **Mock API Responses**: Returns realistic mock data matching `api-spec.md`
- ✅ **Transparent to UI**: No changes needed in UI components
- ✅ **Network Simulation**: Simulates network delays (200-1000ms) for realistic UX testing
- ✅ **Easy Toggle**: Enable via environment variable or URL parameter
- ✅ **Console Logging**: Warns when DEMO_MODE is active

## Quick Start

### Method 1: Environment Variable (Recommended for Development)

Create or edit `.env.local`:

```bash
VITE_DEMO_MODE=true
```

Then run:

```bash
npm run dev
```

### Method 2: URL Query Parameter

Simply add `?demo=true` to your URL:

```
http://localhost:5173/?demo=true
http://localhost:5173/?demo=1
http://localhost:5173/?demo
```

## Architecture

### File Structure

```
src/mocks/
├── index.ts              # Public exports
├── demoMode.ts           # Environment & query parameter detection
├── apiMiddleware.ts      # Request routing to mock responses
└── mockData.ts           # Mock response generators
```

### How It Works

1. **Detection** (`demoMode.ts`):
   - Checks `VITE_DEMO_MODE` environment variable first
   - Falls back to `?demo` URL parameter
   - Defaults to `false` (use real APIs)

2. **Interception** (`client.ts`):
   - `apiRequest()` function checks `isDemoMode()`
   - Routes to `mockApiRequest()` if enabled
   - Otherwise, uses real axios client

3. **Mock Routing** (`apiMiddleware.ts`):
   - Pattern-matches request method and URL
   - Calls appropriate mock data generator
   - Simulates network delay (200-1000ms)

4. **Mock Data** (`mockData.ts`):
   - Generator functions for each API endpoint
   - Stateful: Tracks turn responses for Q&A sessions
   - Realistic data matching `api-spec.md` schemas

## Supported APIs

DEMO_MODE currently mocks these endpoints:

### 1. Presentation Analysis
- **Endpoint**: `POST /presentation/analyze`
- **Mock**: Returns session ID, script, and analysis metrics
- **Metrics**: WPM, filler words, gaze score, logic summary

### 2. Roleplay Start
- **Endpoint**: `POST /roleplay/start`
- **Mock**: Returns first AI question as text + audio base64
- **Audio**: Silent WAV file (placeholder for real TTS)

### 3. Roleplay Turn
- **Endpoint**: `POST /roleplay/turn`
- **Mock**: Cycles through 3 different follow-up questions
- **Responses**: STT text, feedback, next question, audio

### 4. Report Generate
- **Endpoint**: `POST /report/generate`
- **Mock**: Returns comprehensive feedback report
- **Includes**: Overall score, strengths, weaknesses, action items

### 5. Session Cleanup
- **Endpoint**: `DELETE /session/cleanup`
- **Mock**: Returns success status

## Customizing Mock Data

### Modify Response Data

Edit `src/mocks/mockData.ts` to change mock responses:

```typescript
export function generateMockPresentationAnalyzeResponse(
  sessionId: string = 'session_demo_' + Date.now(),
): PresentationAnalyzeResponse {
  return {
    session_id: sessionId,
    script: 'Your custom script...',
    analysis_result: {
      wpm: 120,
      filler_words_count: 2,
      gaze_score: 90,
      logic_summary: 'Your custom feedback...',
    },
  }
}
```

### Add More Turn Responses

The Q&A turn responses cycle through an array. Add more entries to `MOCK_TURN_RESPONSES`:

```typescript
const MOCK_TURN_RESPONSES: RoleplayTurnResponse[] = [
  { /* Response 1 */ },
  { /* Response 2 */ },
  { /* Response 3 */ },
  { /* Add Response 4 here */ },
]
```

### Simulate Different Network Speeds

Modify the delay in `apiMiddleware.ts`:

```typescript
// Current: 200-1000ms random delay
await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 200))

// Fast network: 50-200ms
await new Promise((resolve) => setTimeout(resolve, Math.random() * 150 + 50))

// Slow network: 1000-3000ms
await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000))
```

## Disabling DEMO_MODE

### In Production

DEMO_MODE will never be enabled in production since:
1. It requires explicit configuration (`VITE_DEMO_MODE=true`)
2. Build-time environment variables are embedded
3. URL parameters are user-controlled but clearly visible

### During Development

Simply remove/change the environment variable:

```bash
VITE_DEMO_MODE=false
# or remove the line entirely (defaults to false)
```

Or remove `?demo` from the URL.

## Testing

### Test with Mock Data

```bash
VITE_DEMO_MODE=true npm run dev
```

### Test with Real Backend

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run dev
```

### Build with DEMO_MODE

```bash
VITE_DEMO_MODE=true npm run build
```

Note: The build will be much smaller without a backend requirement, useful for testing deployment pipelines.

## Troubleshooting

### Console Shows "[DEMO_MODE] App is running in demo mode..."

This is expected. DEMO_MODE is active. To disable:
- Set `VITE_DEMO_MODE=false` in `.env.local`
- Remove `?demo` from the URL
- Restart the dev server

### Getting "No mock implementation for..." Error

An API endpoint is being called that doesn't have a mock yet. Either:
1. Add a mock implementation in `apiMiddleware.ts`
2. Add a generator function in `mockData.ts`
3. Switch to real backend: `VITE_DEMO_MODE=false`

### Mock Audio Not Playing

The mock audio is a silent WAV placeholder. To provide real audio:
1. Generate real TTS audio (e.g., using a TTS service)
2. Convert to Base64
3. Update `MOCK_AUDIO_BASE64` in `mockData.ts`

## Best Practices

1. **Keep Mock Data Realistic**: Test realistic scenarios to catch UI bugs
2. **Test Error Cases Separately**: Consider adding mock error responses
3. **Update Mocks with API Changes**: Keep `api-spec.md` and mocks in sync
4. **Document Custom Changes**: Comment why you modified mock data
5. **Don't Commit DEMO_MODE Enabled**: Default should be `VITE_DEMO_MODE=false`

## See Also

- `api-spec.md` - API specification that mocks are based on
- `src/types/api.ts` - TypeScript types for all API responses
- `src/api/client.ts` - HTTP client with DEMO_MODE support

