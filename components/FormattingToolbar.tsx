'use client'

import { useRef } from 'react'

interface FormattingToolbarProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>
    parseMode: 'HTML' | 'Markdown' | 'MarkdownV2'
    onInsert: (text: string) => void
}

export default function FormattingToolbar({ textareaRef, parseMode, onInsert }: FormattingToolbarProps) {
    const insertAtCursor = (before: string, after: string = '') => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selectedText = text.substring(start, end)

        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)

        // Update via React state
        onInsert(newText)

        // Set cursor position after React updates
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = start + before.length + selectedText.length + after.length
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
            }
        }, 0)
    }

    const isFormatSupported = (format: string): boolean => {
        switch (format) {
            case 'bold':
            case 'italic':
            case 'code':
            case 'codeblock':
            case 'link':
                return true // Always supported
            case 'underline':
            case 'strikethrough':
            case 'spoiler':
                return parseMode === 'HTML' || parseMode === 'MarkdownV2'
            case 'quote':
                return parseMode === 'HTML' || parseMode === 'MarkdownV2'
            default:
                return false
        }
    }

    const getFormattingSyntax = (format: string) => {
        switch (format) {
            case 'bold':
                return parseMode === 'HTML' ? ['<b>', '</b>'] : ['*', '*']
            case 'italic':
                return parseMode === 'HTML' ? ['<i>', '</i>'] : ['_', '_']
            case 'underline':
                return parseMode === 'HTML' ? ['<u>', '</u>'] : parseMode === 'MarkdownV2' ? ['__', '__'] : null
            case 'strikethrough':
                return parseMode === 'HTML' ? ['<s>', '</s>'] : parseMode === 'MarkdownV2' ? ['~', '~'] : null
            case 'spoiler':
                return parseMode === 'HTML' ? ['<tg-spoiler>', '</tg-spoiler>'] : parseMode === 'MarkdownV2' ? ['||', '||'] : null
            case 'code':
                return parseMode === 'HTML' ? ['<code>', '</code>'] : ['`', '`']
            case 'codeblock':
                return parseMode === 'HTML' ? ['<pre><code>', '</code></pre>'] : ['```', '```']
            case 'link':
                const url = prompt('Enter URL:')
                if (!url) return null
                if (parseMode === 'HTML') {
                    return [`<a href="${url}">`, '</a>']
                } else {
                    return ['[', `](${url})`]
                }
            case 'quote':
                return parseMode === 'HTML' ? ['<blockquote>', '</blockquote>'] : parseMode === 'MarkdownV2' ? ['> ', ''] : null
            default:
                return null
        }
    }

    const handleFormat = (format: string) => {
        const syntax = getFormattingSyntax(format)
        if (!syntax) {
            alert(`This formatting is not supported in ${parseMode} mode. Please use HTML mode.`)
            return
        }
        insertAtCursor(syntax[0], syntax[1])
    }

    const buttons = [
        { id: 'bold', label: 'Bold', icon: 'B', format: 'bold' },
        { id: 'italic', label: 'Italic', icon: 'I', format: 'italic' },
        { id: 'underline', label: 'Underline', icon: 'U', format: 'underline' },
        { id: 'strikethrough', label: 'Strikethrough', icon: 'S', format: 'strikethrough' },
        { id: 'spoiler', label: 'Spoiler', icon: '👁', format: 'spoiler' },
        { id: 'code', label: 'Code', icon: '</>', format: 'code' },
        { id: 'codeblock', label: 'Code Block', icon: '{ }', format: 'codeblock' },
        { id: 'link', label: 'Link', icon: '🔗', format: 'link' },
        { id: 'quote', label: 'Quote', icon: '❝', format: 'quote' },
    ]


    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
            {buttons.map((button) => {
                const supported = isFormatSupported(button.format)
                return (
                    <button
                        key={button.id}
                        onClick={() => handleFormat(button.format)}
                        disabled={!supported}
                        title={button.label}
                        className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${supported
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 hover:border-purple-500'
                                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                            }
            `}
                    >
                        {button.icon}
                    </button>
                )
            })}
            <div className="flex-1" />
            <span className="text-xs text-slate-500">
                Mode: {parseMode}
            </span>
        </div>
    )
}
