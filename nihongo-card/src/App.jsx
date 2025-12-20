import { useRoutes, Navigate } from 'react-router-dom'
import Card from './components/Card'
import Raw from './components/Raw'
import Tool from './components/Tool'
import Note from './components/Note'
import Chart from './components/Chart'

const routeConfig = [
  { path: '/', element: <Chart /> },
  { path: '/card', element: <Card /> },
  { path: '/raw', element: <Raw /> },
  { path: '/tool', element: <Tool /> },
  { path: '/note', element: <Note /> },
  { path: '*', element: <Navigate to='/' replace /> }
]

export default function App() {
  const element = useRoutes(routeConfig)
  return <>{element}</>
}
