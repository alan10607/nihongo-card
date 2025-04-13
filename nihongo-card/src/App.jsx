import { useRoutes, Navigate } from 'react-router-dom'
import Root from './components/Root'
import Tool from './components/Tool'
import Note from './components/Note'

const routeConfig = [
  { path: '/', element: <Root /> },
  { path: '/tool', element: <Tool /> },
  { path: '/note', element: <Note /> },
  { path: '*', element: <Navigate to='/' replace /> }
]

export default function App() {
  const element = useRoutes(routeConfig)
  return <>{element}</>
}
