import { Link } from 'react-router-dom'
import { Bot, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-surface to-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <p className="text-7xl font-bold text-primary-700 mb-2">404</p>
        <p className="text-xl font-semibold text-on-surface mb-2">Página não encontrada</p>
        <p className="text-on-surface-variant text-sm mb-8">A URL que você acessou não existe.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 hover:bg-primary-600 text-white font-medium rounded-xl text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o painel
        </Link>
      </div>
    </div>
  )
}
