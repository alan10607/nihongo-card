import './App.css'
import Root from './components/Root'
import Tool from './components/Tool'
import Note from './components/Note'
import { Navigate, useRoutes } from "react-router-dom"

const routeConfig = [
  {
    path: "/nihongo-card/",
    element: <Root />
  },
  {
    path: "/nihongo-card/tool",
    element: <Tool />
  },
  {
    path: "/nihongo-card/note",
    element: <Note />
  },
  {
    path: "*",
    element: <Navigate to="/nihongo-card/" replace />
  }
]

function App() {
  const element = useRoutes(routeConfig)

  return (
    <>
      {element}
    </>
  )
}

export default App
