import { useState } from 'react'
import React from 'react'
import {Routes,Route} from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Mainpage from './component/Mainpage'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      <Routes>
        <Route path='/' element={<Mainpage/>}></Route>
      </Routes>
      
   
    </>
  )
}

export default App
