import { useState } from 'react'
import SplashScreen from './pages/SplashScreen.jsx'
import GrandHall from './pages/GrandHall.jsx'
import ArtifactDetail from './pages/ArtifactDetail.jsx'

export default function AnubisApp() {
  const [screen, setScreen] = useState('splash')
  const [activeTab, setActiveTab] = useState('temple')

  function navigate(target) {
    if (target === 'artifact') {
      setScreen('artifact')
      setActiveTab('mysteries')
    } else if (['temple', 'mysteries', 'treasury', 'scribe'].includes(target)) {
      setActiveTab(target)
      setScreen(target === 'mysteries' ? 'artifact' : 'hall')
    } else {
      setScreen(target)
    }
  }

  if (screen === 'splash') return <SplashScreen onBegin={() => setScreen('hall')} />
  if (screen === 'artifact') return <ArtifactDetail onNavigate={navigate} activeTab={activeTab} />
  return <GrandHall onNavigate={navigate} activeTab={activeTab} />
}
