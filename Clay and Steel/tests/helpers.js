// Injects a fake Supabase session into localStorage and mocks the REST API
// so the app renders the authenticated view without hitting real servers.
export const SUPABASE_URL = 'https://jmtogdlsgpfoefbgdubm.supabase.co'
export const STORAGE_KEY  = 'sb-jmtogdlsgpfoefbgdubm-auth-token'

export const FAKE_USER = {
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
}

function makeJwt(payload) {
  const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.fakesig`
}

const FAKE_TOKEN = makeJwt({
  sub: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  exp: 9_999_999_999,
  iat: 1_000_000_000,
})

const FAKE_SESSION = {
  access_token: FAKE_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9_999_999_999,
  refresh_token: 'fake-refresh-token',
  user: FAKE_USER,
}

// Call before page.goto() to simulate a logged-in user with no saved state.
export async function mockAuth(page, savedState = null) {
  // Inject session into localStorage before the page scripts run
  await page.addInitScript(({ key, session }) => {
    localStorage.setItem(key, JSON.stringify(session))
  }, { key: STORAGE_KEY, session: FAKE_SESSION })

  // Mock user_state read — Supabase returns { state: <stateObj> } per row, or null
  await page.route(`${SUPABASE_URL}/rest/v1/user_state*`, async route => {
    const method = route.request().method()
    if (method === 'GET') {
      // savedState = the state object; wrap it in a row, or pass null for a new user
      const body = savedState ? JSON.stringify({ state: savedState }) : 'null'
      await route.fulfill({ status: 200, contentType: 'application/json', body })
    } else {
      // upsert / patch → accept silently
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    }
  })

  // Absorb any auth refresh/validation calls
  await page.route(`${SUPABASE_URL}/auth/v1/**`, async route => {
    const url = route.request().url()
    if (url.includes('/token') || url.includes('/session') || url.includes('/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...FAKE_SESSION, user: FAKE_USER }),
      })
    } else {
      await route.continue()
    }
  })
}

// Fast-forward past the 3.9-second LoadingScreen animation.
export async function skipLoadingScreen(page) {
  await page.clock.fastForward(4500)
}
