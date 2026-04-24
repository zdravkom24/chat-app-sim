import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { testScripts, type TestStep, type TestCategory, type TestScenario } from '@/data/testScripts'

const STORAGE_KEY = 'chat-sim-test-checks'

interface Props {
  onClose: () => void
  activeConversationId: number | null
}

function loadChecks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveChecks(checks: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks))
}

const TYPE_STYLES: Record<TestStep['type'], { label: string; bg: string; text: string }> = {
  send: { label: 'YOU', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  click: { label: 'CLICK', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  wait: { label: 'WAIT', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
  check: { label: 'CHECK', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        copyToClipboard(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="shrink-0 rounded p-0.5 text-gray-300 hover:text-gray-500"
      title="Copy message"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

function SendButton({ text, conversationId, onSend }: { text: string; conversationId: number | null; onSend: (text: string) => void }) {
  const [sent, setSent] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!conversationId) return
        onSend(text)
        setSent(true)
        setTimeout(() => setSent(false), 1200)
      }}
      disabled={!conversationId}
      className="shrink-0 rounded p-0.5 text-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
      title={conversationId ? 'Send to chat' : 'Select a conversation first'}
    >
      {sent ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      )}
    </button>
  )
}

function getProgress(checks: Record<string, boolean>, scenario: TestScenario): { done: number; total: number } {
  const total = scenario.steps.length
  const done = scenario.steps.filter(s => checks[s.id]).length
  return { done, total }
}

function getCategoryProgress(checks: Record<string, boolean>, category: TestCategory): { done: number; total: number } {
  let done = 0, total = 0
  for (const sc of category.scenarios) {
    const p = getProgress(checks, sc)
    done += p.done
    total += p.total
  }
  return { done, total }
}

export default function TestScripts({ onClose, activeConversationId }: Props) {
  const queryClient = useQueryClient()
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set())

  const sendMessage = useMutation({
    mutationFn: (text: string) =>
      api.messages.send({
        conversationId: activeConversationId!,
        type: 'text',
        content: { body: text },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  useEffect(() => {
    saveChecks(checks)
  }, [checks])

  const toggleCheck = useCallback((stepId: string) => {
    setChecks(prev => ({ ...prev, [stepId]: !prev[stepId] }))
  }, [])

  const resetAll = useCallback(() => {
    setChecks({})
  }, [])

  const resetScenario = useCallback((scenario: TestScenario) => {
    setChecks(prev => {
      const next = { ...prev }
      for (const step of scenario.steps) {
        delete next[step.id]
      }
      return next
    })
  }, [])

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleScenario = useCallback((id: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-xl bg-white dark:bg-gray-900 shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Test Scripts</h2>
          <div className="flex gap-2">
            <button
              onClick={resetAll}
              className="rounded border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Reset All
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {testScripts.map((category) => {
            const catExpanded = expandedCategories.has(category.id)
            const catProgress = getCategoryProgress(checks, category)
            return (
              <div key={category.id} className="border-b border-gray-100 dark:border-gray-700">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${catExpanded ? 'rotate-90' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{category.description}</span>
                  </div>
                  <span className={`text-xs font-medium ${catProgress.done === catProgress.total && catProgress.total > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {catProgress.done}/{catProgress.total}
                  </span>
                </button>

                {/* Scenarios */}
                {catExpanded && category.scenarios.map((scenario) => {
                  const scExpanded = expandedScenarios.has(scenario.id)
                  const scProgress = getProgress(checks, scenario)
                  return (
                    <div key={scenario.id} className="border-t border-gray-50 dark:border-gray-800">
                      {/* Scenario header */}
                      <button
                        onClick={() => toggleScenario(scenario.id)}
                        className="flex w-full items-center gap-2 px-5 pl-10 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${scExpanded ? 'rotate-90' : ''}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{scenario.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{scenario.description}</span>
                        </div>
                        <span className={`text-xs font-medium ${scProgress.done === scProgress.total ? 'text-green-600' : 'text-gray-400'}`}>
                          {scProgress.done}/{scProgress.total}
                        </span>
                      </button>

                      {/* Steps */}
                      {scExpanded && (
                        <div className="pb-2">
                          {scenario.steps.map((step) => {
                            const style = TYPE_STYLES[step.type]
                            const checked = !!checks[step.id]
                            return (
                              <label
                                key={step.id}
                                className={`flex items-start gap-2.5 px-5 pl-14 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${checked ? 'opacity-50' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCheck(step.id)}
                                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-app-primary focus:ring-app-primary"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                                      {style.label}
                                    </span>
                                    <span className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${step.type === 'send' ? 'font-mono' : ''}`}>
                                      {step.action}
                                    </span>
                                    {step.type === 'send' && (
                                      <>
                                        <SendButton text={step.action} conversationId={activeConversationId} onSend={(text) => sendMessage.mutate(text)} />
                                        <CopyButton text={step.action} />
                                      </>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {step.expect}
                                  </p>
                                </div>
                              </label>
                            )
                          })}
                          {/* Reset scenario button */}
                          <div className="px-5 pl-14 pt-1 pb-2">
                            <button
                              onClick={() => resetScenario(scenario)}
                              className="text-xs text-red-500 hover:text-red-700 hover:underline"
                            >
                              Reset scenario
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
