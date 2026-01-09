'use client'

interface MessagePreviewProps {
    text: string
    parseMode: 'HTML' | 'Markdown' | 'MarkdownV2'
    mediaPreview?: string | null
    contentType?: 'text' | 'photo' | 'video' | 'document'
}

export default function MessagePreview({ text, parseMode, mediaPreview, contentType }: MessagePreviewProps) {
    const renderContent = () => {
        if (!text.trim() && !mediaPreview) {
            return <p className="text-slate-500 italic">Preview will appear here...</p>
        }

        const escapeHtml = (str: string) => {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
        }

        let renderedText = text

        if (parseMode === 'HTML') {
            const parts: Array<{ type: 'tag' | 'text'; content: string }> = []
            let lastIndex = 0
            const tagPattern = /<(b|strong|i|em|u|ins|s|strike|del|tg-spoiler|code|pre|a|blockquote)[^>]*>[\s\S]*?<\/(?:b|strong|i|em|u|ins|s|strike|del|tg-spoiler|code|pre|a|blockquote)>/gi

            let match
            while ((match = tagPattern.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
                }
                parts.push({ type: 'tag', content: match[0] })
                lastIndex = match.index + match[0].length
            }
            if (lastIndex < text.length) {
                parts.push({ type: 'text', content: text.substring(lastIndex) })
            }

            renderedText = parts.map(part => {
                if (part.type === 'text') {
                    return escapeHtml(part.content)
                } else {
                    return part.content
                        .replace(/<(b|strong)>(.*?)<\/(b|strong)>/gi, '<strong>$2</strong>')
                        .replace(/<(i|em)>(.*?)<\/(i|em)>/gi, '<em>$2</em>')
                        .replace(/<(u|ins)>(.*?)<\/(u|ins)>/gi, '<u>$2</u>')
                        .replace(/<(s|strike|del)>(.*?)<\/(s|strike|del)>/gi, '<s>$2</s>')
                        .replace(/<tg-spoiler>(.*?)<\/tg-spoiler>/gi, '<span class="spoiler">$1</span>')
                        .replace(/<code>(.*?)<\/code>/gi, '<code class="inline-code">$1</code>')
                        .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '<pre><code>$1</code></pre>')
                        .replace(/<a href="([^"]+)">(.*?)<\/a>/gi, '<a href="$1" target="_blank" rel="noopener" class="text-blue-300 underline">$2</a>')
                        .replace(/<blockquote>(.*?)<\/blockquote>/gi, '<blockquote>$1</blockquote>')
                }
            }).join('')
        } else if (parseMode === 'Markdown') {
            renderedText = text
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/_([^_]+)_/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-300 underline">$1</a>')
            renderedText = escapeHtml(renderedText)
            // Restore formatted parts that were escaped
            renderedText = renderedText
                .replace(/&lt;strong&gt;/g, '<strong>')
                .replace(/&lt;\/strong&gt;/g, '</strong>')
                .replace(/&lt;em&gt;/g, '<em>')
                .replace(/&lt;\/em&gt;/g, '</em>')
                .replace(/&lt;code class="inline-code"&gt;/g, '<code class="inline-code">')
                .replace(/&lt;\/code&gt;/g, '</code>')
                .replace(/&lt;pre&gt;&lt;code&gt;/g, '<pre><code>')
                .replace(/&lt;\/code&gt;&lt;\/pre&gt;/g, '</code></pre>')
                .replace(/&lt;a href="([^"]+)" target="_blank" rel="noopener" class="text-blue-300 underline"&gt;/g, '<a href="$1" target="_blank" rel="noopener" class="text-blue-300 underline">')
                .replace(/&lt;\/a&gt;/g, '</a>')
        } else {
            renderedText = text
                .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                .replace(/_([^_]+)_/g, '<em>$1</em>')
                .replace(/__([^_]+)__/g, '<u>$1</u>')
                .replace(/~([^~]+)~/g, '<s>$1</s>')
                .replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler">$1</span>')
                .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-300 underline">$1</a>')
                .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
            renderedText = escapeHtml(renderedText)
            // Restore formatted parts that were escaped
            renderedText = renderedText
                .replace(/&lt;strong&gt;/g, '<strong>')
                .replace(/&lt;\/strong&gt;/g, '</strong>')
                .replace(/&lt;em&gt;/g, '<em>')
                .replace(/&lt;\/em&gt;/g, '</em>')
                .replace(/&lt;u&gt;/g, '<u>')
                .replace(/&lt;\/u&gt;/g, '</u>')
                .replace(/&lt;s&gt;/g, '<s>')
                .replace(/&lt;\/s&gt;/g, '</s>')
                .replace(/&lt;span class="spoiler"&gt;/g, '<span class="spoiler">')
                .replace(/&lt;\/span&gt;/g, '</span>')
                .replace(/&lt;code class="inline-code"&gt;/g, '<code class="inline-code">')
                .replace(/&lt;\/code&gt;/g, '</code>')
                .replace(/&lt;pre&gt;&lt;code&gt;/g, '<pre><code>')
                .replace(/&lt;\/code&gt;&lt;\/pre&gt;/g, '</code></pre>')
                .replace(/&lt;a href="([^"]+)" target="_blank" rel="noopener" class="text-blue-300 underline"&gt;/g, '<a href="$1" target="_blank" rel="noopener" class="text-blue-300 underline">')
                .replace(/&lt;\/a&gt;/g, '</a>')
                .replace(/&lt;blockquote&gt;/g, '<blockquote>')
                .replace(/&lt;\/blockquote&gt;/g, '</blockquote>')
        }

        return (
            <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedText }}
            />
        )
    }

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-400">Telegram Preview</span>
                <span className="text-xs text-slate-600 ml-auto">Mode: {parseMode}</span>
            </div>

            <div className="bg-blue-600 rounded-2xl rounded-tl-sm p-4 max-w-[85%] ml-auto">
                {mediaPreview && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                        {contentType === 'photo' && (
                            <img src={mediaPreview} alt="Preview" className="w-full h-auto" />
                        )}
                        {contentType === 'video' && (
                            <div className="bg-slate-800 aspect-video flex items-center justify-center">
                                <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        )}
                        {contentType === 'document' && (
                            <div className="bg-slate-800 p-4 flex items-center gap-3">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-slate-300 text-sm">Document</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-white text-sm whitespace-pre-wrap break-words">
                    {renderContent()}
                </div>

                <div className="flex items-center justify-end gap-1 mt-2 text-xs text-blue-200">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 flex justify-between">
                <span>{text.length} characters</span>
                <span>
                    {text.length > 4096 && <span className="text-red-400">Exceeds limit (4096)</span>}
                    {mediaPreview && text.length > 1024 && <span className="text-red-400">Caption exceeds limit (1024)</span>}
                </span>
            </div>
        </div>
    )
}
