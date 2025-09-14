import { useRoutes, Navigate } from 'react-router-dom'
import Root from './components/Root'
import Raw from './components/Raw'
import Tool from './components/Tool'
import Note from './components/Note'

const routeConfig = [
  { path: '/', element: <Root /> },
  { path: '/raw', element: <Raw /> },
  { path: '/tool', element: <Tool /> },
  { path: '/note', element: <Note /> },
  { path: '*', element: <Navigate to='/' replace /> }
]

export default function App() {
  const element = useRoutes(routeConfig)
  return <>{element}</>
}
