import { useEffect, useRef, useState } from 'react'
import Nav from './components/Nav/Nav.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workouts from './pages/Workouts.jsx'
import Split from './pages/Split.jsx'
import Settings from './pages/Settings.jsx'
import Progress from './pages/Progress.jsx'
import Onboarding from './components/Onboarding/Onboarding.jsx'
import LoadingScreen from './components/LoadingScreen/LoadingScreen.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { defaultState } from './lib/storage.js'
import { supabase } from './lib/supabase.js'

const ADMIN_EMAIL = 'travis.g.mader@gmail.com'

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [stateReady, setStateReady] = useState(false)
  const [page, setPage]           = useState('dashboard')
  const [state, setState]         = useState(() => defaultState())
  const stateLoaded               = useRef(false)

  // Auth init — runs once
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null
      setUser(next)
      if (!next) {
        stateLoaded.current = false
        setStateReady(false)
        setState(defaultState())
        setLoading(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load this user's state from Supabase on login
  useEffect(() => {
    if (!user) return
    stateLoaded.current = false
    supabase
      .from('user_state')
      .select('state')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.state) setState({ ...defaultState(), ...data.state })
        stateLoaded.current = true
        setStateReady(true)
      })
  }, [user?.id])

  // Persist state to Supabase on every change (after initial load)
  useEffect(() => {
    if (!user || !stateLoaded.current) return
    supabase
      .from('user_state')
      .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() })
  }, [state])

  const isAdmin = user?.email === ADMIN_EMAIL

  if (!authReady) return null
  if (!user)      return <AuthPage />

  let content
  if (page === 'workouts') {
    content = <Workouts state={state} setState={setState} isAdmin={isAdmin} />
  } else if (page === 'progress') {
    content = <Progress state={state} />
  } else if (page === 'settings') {
    content = <Split state={state} setState={setState} setPage={setPage} />
  } else if (page === 'gear') {
    content = <Settings state={state} setState={setState} user={user} isAdmin={isAdmin} onSignOut={() => supabase.auth.signOut()} />
  } else {
    content = <Dashboard state={state} setState={setState} setPage={setPage} />
  }

  return (
    <>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      {stateReady && !state.onboarded && (
        <Onboarding setState={setState} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Nav
          page={page}
          setPage={setPage}
          user={user}
          isAdmin={isAdmin}
          onSignOut={() => supabase.auth.signOut()}
        />
        <main style={{ flex: 1 }}>{content}</main>
      </div>
    </>
  )
}
