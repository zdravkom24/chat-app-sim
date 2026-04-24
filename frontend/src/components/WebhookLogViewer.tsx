import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { WebhookLog } from '@/types/whatsapp'

interface Props {
  onClose: () => void
}

export default function WebhookLogViewer({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: logs = [] } = useQuery({
    queryKey: ['webhookLogs'],
    queryFn: api.webhookLogs.list,
    refetchInterval: 3000,
  })

  const clearLogs = useMutation({
    mutationFn: api.webhookLogs.clear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhookLogs'] }),
  })

  function formatJson(str: string) {
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  function getStatusColor(status: number | null) {
    if (!status || status === 0) return 'text-red-500'
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400) return 'text-red-500'
    return 'text-yellow-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="ml-auto h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Webhook Logs</h2>
          <div className="flex gap-2">
            <button
              onClick={() => clearLogs.mutate()}
              className="rounded border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Clear All
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              No webhook logs yet
            </div>
          ) : (
            logs.map((log: WebhookLog) => (
              <div key={log.id} className="border-b border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.direction === 'outgoing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {log.direction === 'outgoing' ? 'OUT' : 'IN'}
                  </span>
                  <span className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                    {log.method} {log.url}
                  </span>
                  <span className={`text-sm font-medium ${getStatusColor(log.responseStatus)}`}>
                    {log.responseStatus || 'ERR'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </button>

                {expandedId === log.id && (
                  <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Request Body</h4>
                      <pre className="max-h-60 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400 font-mono">
                        {formatJson(log.body)}
                      </pre>
                    </div>
                    {log.responseBody && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Response</h4>
                        <pre className="max-h-40 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400 font-mono">
                          {formatJson(log.responseBody)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
