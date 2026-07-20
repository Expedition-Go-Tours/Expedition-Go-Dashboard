import { useState, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { requestKeyword as requestKeywordApi } from '@/features/products/api'
import { SUGGESTED_KEYWORDS } from '@/constants/keywords'

export default function Step06Keywords() {
  const keywords = useProductBuilderStore((s) => s.keywords)
  const addKeyword = useProductBuilderStore((s) => s.addKeyword)
  const removeKeyword = useProductBuilderStore((s) => s.removeKeyword)
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const inputRef = useRef(null)

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return SUGGESTED_KEYWORDS.slice(0, 20)
    const q = query.toLowerCase()
    return SUGGESTED_KEYWORDS.filter(
      (kw) => kw.toLowerCase().includes(q) && !keywords.includes(kw),
    ).slice(0, 20)
  }, [query, keywords])

  const trimmedQuery = query.trim()
  const isCustom =
    trimmedQuery &&
    !SUGGESTED_KEYWORDS.some((kw) => kw.toLowerCase() === trimmedQuery.toLowerCase()) &&
    !keywords.includes(trimmedQuery)

  function selectKeyword(kw) {
    if (keywords.length >= 15) return
    addKeyword(kw)
    setQuery('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function handleRequest() {
    const kw = trimmedQuery
    if (!kw || keywords.includes(kw) || keywords.length >= 15 || requesting) return

    setRequesting(true)
    requestKeywordApi(kw)
      .then(() => {
        addKeyword(kw)
        toast.success(`"${kw}" added. It will be reviewed by the team.`)
        setQuery('')
        setShowSuggestions(false)
        inputRef.current?.focus()
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Failed to request keyword')
      })
      .finally(() => {
        setRequesting(false)
      })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (!val || keywords.includes(val) || keywords.length >= 15) return

      const isPreApproved = SUGGESTED_KEYWORDS.some((kw) => kw.toLowerCase() === val.toLowerCase())
      if (isPreApproved) {
        selectKeyword(val)
      } else {
        handleRequest()
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  function toggleKeyword(kw) {
    if (keywords.includes(kw)) {
      removeKeyword(keywords.indexOf(kw))
    } else if (keywords.length < 15) {
      selectKeyword(kw)
    }
  }

  return (
    <div className="max-w-[720px]">
      <label className="block text-sm font-semibold mb-2 text-slate-800">
        Keywords <span className="font-normal text-slate-400">({keywords.length}/15)</span>
      </label>
      <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
        Search suggested keywords or request a new one to help customers find your product.
        Think about theme, timing, who it's for, and what makes it unique.
      </p>

      {/* Selected keywords as chips */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {keywords.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full text-[13px] font-semibold text-emerald-700 border border-emerald-200"
            >
              {kw}
              <button
                onClick={() => removeKeyword(i)}
                type="button"
                className="bg-transparent border-0 cursor-pointer text-xs text-emerald-500 hover:text-red-500 p-0 leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input with suggestions dropdown */}
      <div className="relative mb-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm transition-all focus-ring"
            type="text"
            placeholder={keywords.length >= 15 ? 'Max 15 keywords reached' : 'Search or type a keyword...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            disabled={keywords.length >= 15}
          />
        </div>

        {showSuggestions && (filteredSuggestions.length > 0 || isCustom) && keywords.length < 15 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {filteredSuggestions.length > 0 && !query.trim() && (
              <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                Suggested keywords
              </div>
            )}
            <div className="max-h-[240px] overflow-y-auto">
              {filteredSuggestions.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-emerald-50 transition-colors border-0 bg-transparent cursor-pointer ${
                    keywords.includes(kw) ? 'text-emerald-600 font-medium' : 'text-slate-700'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    toggleKeyword(kw)
                  }}
                >
                  {keywords.includes(kw) && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <circle cx="7" cy="7" r="6" fill="#16a34a" />
                      <path d="M4.5 7L6.5 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {!keywords.includes(kw) && (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                  <span>{kw}</span>
                </button>
              ))}
            </div>

            {/* Request custom keyword row */}
            {isCustom && (
              <>
                {filteredSuggestions.length > 0 && (
                  <div className="border-t border-slate-100" />
                )}
                <button
                  type="button"
                  onClick={handleRequest}
                  disabled={requesting}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-amber-50 transition-colors border-0 bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 inline-flex items-center justify-center text-xs font-bold shrink-0">
                    +
                  </span>
                  <span>
                    Request <strong className="text-slate-800">"{trimmedQuery}"</strong> as a keyword
                  </span>
                  {requesting && (
                    <svg className="animate-spin h-4 w-4 text-slate-400 ml-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick select row - common categories as pills */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Quick add by category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['Adventure', 'Cultural', 'Nature', 'Food & drink', 'Walking', 'Photography', 'Sunset', 'Family friendly', 'Private tour', 'Small group'].map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => toggleKeyword(kw)}
              className={`px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors ${
                keywords.includes(kw)
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
