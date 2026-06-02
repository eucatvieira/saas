import { clsx } from 'clsx'

const variants = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show:   'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-800',
  active:    'bg-green-100 text-green-800',
  inactive:  'bg-gray-100 text-gray-600',
  trial:     'bg-violet-100 text-violet-800',
}

const labels: Record<string, string> = {
  pending:   'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  no_show:   'Não compareceu',
  completed: 'Concluído',
  active:    'Ativo',
  inactive:  'Inativo',
  trial:     'Trial',
}

interface Props {
  status: keyof typeof variants
  className?: string
}

export function Badge({ status, className }: Props) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[status], className)}>
      {labels[status] ?? status}
    </span>
  )
}
