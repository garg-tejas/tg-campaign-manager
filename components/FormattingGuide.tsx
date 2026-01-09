'use client'

import { useState } from 'react'

interface FormattingGuideProps {
    parseMode: 'HTML' | 'Markdown' | 'MarkdownV2'
}

export default function FormattingGuide({ parseMode }: FormattingGuideProps) {
    const [isOpen, setIsOpen] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        // You could add a toast notification here
    }

    const getFormattingTable = () => {
        if (parseMode === 'HTML') {
            return [
                { format: 'Bold', syntax: '<b>text</b>', example: '**Bold text**' },
                { format: 'Italic', syntax: '<i>text</i>', example: '*Italic text*' },
                { format: 'Underline', syntax: '<u>text</u>', example: 'Underlined text' },
                { format: 'Strikethrough', syntax: '<s>text</s>', example: '~~Strikethrough text~~' },
                { format: 'Spoiler', syntax: '<tg-spoiler>text</tg-spoiler>', example: 'Spoiler text' },
                { format: 'Code', syntax: '<code>text</code>', example: '`code`' },
                { format: 'Code Block', syntax: '<pre><code>code</code></pre>', example: '```code```' },
                { format: 'Link', syntax: '<a href="url">text</a>', example: 'Click here' },
                { format: 'Quote', syntax: '<blockquote>text</blockquote>', example: 'Quoted text' },
            ]
        } else if (parseMode === 'Markdown') {
            return [
                { format: 'Bold', syntax: '*text*', example: '*Bold text*' },
                { format: 'Italic', syntax: '_text_', example: '_Italic text_' },
                { format: 'Code', syntax: '`text`', example: '`code`' },
                { format: 'Code Block', syntax: '```code```', example: '```code```' },
                { format: 'Link', syntax: '[text](url)', example: '[Click here](https://example.com)' },
            ]
        } else {
            // MarkdownV2
            return [
                { format: 'Bold', syntax: '*text*', example: '*Bold text*' },
                { format: 'Italic', syntax: '_text_', example: '_Italic text_' },
                { format: 'Underline', syntax: '__text__', example: '__Underlined text__' },
                { format: 'Strikethrough', syntax: '~text~', example: '~Strikethrough text~' },
                { format: 'Spoiler', syntax: '||text||', example: '||Spoiler text||' },
                { format: 'Code', syntax: '`text`', example: '`code`' },
                { format: 'Code Block', syntax: '```code```', example: '```code```' },
                { format: 'Link', syntax: '[text](url)', example: '[Click here](https://example.com)' },
                { format: 'Quote', syntax: '> text', example: '> Quoted text' },
            ]
        }
    }

    const getNotes = () => {
        if (parseMode === 'MarkdownV2') {
            return [
                '⚠️ MarkdownV2 requires escaping special characters: . ! - ( ) [ ] { } > # + = | ~ `',
                '⚠️ For easier formatting, consider using HTML mode instead.',
                '✅ Emojis work natively in all modes - just paste them directly.',
            ]
        } else if (parseMode === 'Markdown') {
            return [
                '⚠️ Markdown mode has limited support (no underline, strikethrough, spoiler).',
                '✅ For full formatting options, use HTML mode.',
                '✅ Emojis work natively - just paste them directly.',
            ]
        } else {
            return [
                '✅ HTML mode supports all formatting options.',
                '✅ Emojis work natively - just paste them directly.',
                '✅ Character limits: Text messages (4096), Captions (1024).',
            ]
        }
    }

    const examples = [
        {
            title: 'Mixed Formatting',
            html: '<b>Bold</b> and <i>italic</i> with <code>code</code>',
            markdown: '*Bold* and _italic_ with `code`',
            markdownv2: '*Bold* and _italic_ with `code`',
        },
        {
            title: 'Link Example',
            html: 'Visit <a href="https://telegram.org">Telegram</a>',
            markdown: 'Visit [Telegram](https://telegram.org)',
            markdownv2: 'Visit [Telegram](https://telegram.org)',
        },
    ]

    const table = getFormattingTable()
    const notes = getNotes()

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-slate-200">Formatting Guide ({parseMode})</span>
                </div>
                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="px-4 py-4 space-y-4 border-t border-slate-700">
                    {/* Formatting Table */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Quick Reference</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-2 text-slate-400 font-medium">Format</th>
                                        <th className="text-left py-2 text-slate-400 font-medium">Syntax</th>
                                        <th className="text-right py-2 text-slate-400 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {table.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-800">
                                            <td className="py-2 text-slate-300">{row.format}</td>
                                            <td className="py-2">
                                                <code className="text-purple-400 bg-slate-800 px-2 py-1 rounded text-xs">
                                                    {row.syntax}
                                                </code>
                                            </td>
                                            <td className="py-2 text-right">
                                                <button
                                                    onClick={() => copyToClipboard(row.syntax)}
                                                    className="text-purple-500 hover:text-purple-400 text-xs"
                                                >
                                                    Copy
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Examples */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Examples</h4>
                        <div className="space-y-2">
                            {examples.map((example, idx) => {
                                const exampleText = parseMode === 'HTML'
                                    ? example.html
                                    : parseMode === 'Markdown'
                                        ? example.markdown
                                        : example.markdownv2

                                return (
                                    <div key={idx} className="bg-slate-800/50 rounded p-3">
                                        <p className="text-xs text-slate-400 mb-1">{example.title}</p>
                                        <div className="flex items-center justify-between">
                                            <code className="text-purple-400 text-xs flex-1">{exampleText}</code>
                                            <button
                                                onClick={() => copyToClipboard(exampleText)}
                                                className="ml-2 text-purple-500 hover:text-purple-400 text-xs"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Important Notes</h4>
                        <ul className="space-y-1">
                            {notes.map((note, idx) => (
                                <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                                    <span className="mt-0.5">•</span>
                                    <span>{note}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
