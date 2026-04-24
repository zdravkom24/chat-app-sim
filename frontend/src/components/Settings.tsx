import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Settings as SettingsType } from '@/types/whatsapp'

interface Props {
  onClose: () => void
}

export default function Settings({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<SettingsType>>({})

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const updateSettings = useMutation({
    mutationFn: (data: Partial<SettingsType>) => api.settings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  function handleSave() {
    updateSettings.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL</label>
            <input
              type="text"
              value={form.webhook_url ?? ''}
              onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
              className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-app-primary focus:outline-none"
              placeholder="http://host.docker.internal:4091/api/webhook"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">The URL to send inbound webhooks to</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verify Token</label>
            <input
              type="text"
              value={form.verify_token ?? ''}
              onChange={(e) => setForm({ ...form, verify_token: e.target.value })}
              className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-app-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number ID</label>
              <input
                type="text"
                value={form.phone_number_id ?? ''}
                onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })}
                className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-app-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Account ID</label>
              <input
                type="text"
                value={form.business_account_id ?? ''}
                onChange={(e) => setForm({ ...form, business_account_id: e.target.value })}
                className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-app-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Phone Number</label>
            <input
              type="text"
              value={form.display_phone_number ?? ''}
              onChange={(e) => setForm({ ...form, display_phone_number: e.target.value })}
              className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-app-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_status"
              checked={form.auto_status_webhooks === 'true'}
              onChange={(e) =>
                setForm({ ...form, auto_status_webhooks: e.target.checked ? 'true' : 'false' })
              }
              className="h-4 w-4 rounded border-gray-300 text-app-primary focus:ring-app-primary"
            />
            <label htmlFor="auto_status" className="text-sm text-gray-700 dark:text-gray-300">
              Auto-fire status webhooks (sent / delivered / read)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-app-primary px-4 py-2 text-sm font-medium text-white hover:bg-app-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
