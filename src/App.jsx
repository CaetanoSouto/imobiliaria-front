import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Vitrine from './pages/Vitrine'
import NaoEncontrada from './pages/NaoEncontrada'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="principal">
        <Routes>
          <Route path="/" element={<Vitrine />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
