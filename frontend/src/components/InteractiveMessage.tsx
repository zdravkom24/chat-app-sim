import { useState } from 'react'

interface Props {
  interactive: Record<string, unknown>
  onAction: (type: string, content: Record<string, unknown>) => void
}

export default function InteractiveMessage({ interactive, onAction }: Props) {
  const [listOpen, setListOpen] = useState(false)
  const interactiveType = interactive.type as string

  function handleButtonClick(button: { id: string; title: string }) {
    onAction('interactive', {
      interactive: {
        type: 'button_reply',
        button_reply: { id: button.id, title: button.title },
      },
    })
  }

  function handleListSelect(row: { id: string; title: string }) {
    setListOpen(false)
    onAction('interactive', {
      interactive: {
        type: 'list_reply',
        list_reply: { id: row.id, title: row.title },
      },
    })
  }

  if (interactiveType === 'button') {
    const body = (interactive.body as { text: string })?.text ?? ''
    const action = interactive.action as {
      buttons: Array<{ type: string; reply: { id: string; title: string } }>
    }
    const buttons = action?.buttons ?? []

    return (
      <div>
        <p className="whitespace-pre-wrap wrap-break-words mb-2">{body}</p>
        <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-gray-600 pt-1.5">
          {buttons.map((btn) => (
            <button
              key={btn.reply.id}
              onClick={() => handleButtonClick(btn.reply)}
              className="rounded border border-app-primary/30 px-3 py-1.5 text-sm font-medium text-app-dark hover:bg-app-primary/10 transition-colors"
            >
              {btn.reply.title}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (interactiveType === 'list') {
    const body = (interactive.body as { text: string })?.text ?? ''
    const action = interactive.action as {
      button: string
      sections: Array<{
        title: string
        rows: Array<{ id: string; title: string; description?: string }>
      }>
    }

    return (
      <div>
        <p className="whitespace-pre-wrap wrap-break-words mb-2">{body}</p>
        <div className="border-t border-gray-200 dark:border-gray-600 pt-1.5">
          <button
            onClick={() => setListOpen(!listOpen)}
            className="w-full rounded border border-app-primary/30 px-3 py-1.5 text-sm font-medium text-app-dark hover:bg-app-primary/10 transition-colors"
          >
            {action?.button || 'Select'}
          </button>

          {listOpen && action?.sections && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              {action.sections.map((section) => (
                <div key={section.title}>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {section.title}
                  </div>
                  {section.rows.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => handleListSelect(row)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.title}</div>
                      {row.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (interactiveType === 'button_reply') {
    const reply = interactive.button_reply as { id: string; title: string }
    return <p className="text-sm">{reply?.title ?? '[Button reply]'}</p>
  }

  if (interactiveType === 'list_reply') {
    const reply = interactive.list_reply as { id: string; title: string }
    return <p className="text-sm">{reply?.title ?? '[List selection]'}</p>
  }

  return <p className="text-sm text-gray-500 italic">[Interactive: {interactiveType}]</p>
}
