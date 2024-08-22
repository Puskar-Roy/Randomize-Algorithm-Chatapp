import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import RandomChat from './FindFriend'

function App() {
  const [count, setCount] = useState(0)

  return (

    <RandomChat />

  )
}

export default App
