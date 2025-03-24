import './App.css'
import Root from './components/Root'
import { Navigate, useRoutes } from "react-router-dom"

const routeConfig = [
  {
    path: "/nihongo-card/",
    element: <Root />
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
