interface Props {
  content: string
}

export default function MarkdownRenderer({ content }: Props) {
  const rendered = parseMarkdown(content)
  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseMarkdown(md: string): string {
  const lines = md.split('\n')
  const result: string[] = []
  let inCode = false
  let codeLang = ''
  let codeLines: string[] = []
  let inList = false
  let inOrderedList = false

  const closeList = () => {
    if (inList) { result.push('</ul>'); inList = false }
    if (inOrderedList) { result.push('</ol>'); inOrderedList = false }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCode) {
        result.push(`<pre><code class="lang-${codeLang}">${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        inCode = false
        codeLines = []
        codeLang = ''
      } else {
        closeList()
        inCode = true
        codeLang = line.slice(3).trim()
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (line.startsWith('### ')) {
      closeList()
      result.push(`<h3>${inlineFormat(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      closeList()
      result.push(`<h2>${inlineFormat(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      closeList()
      result.push(`<h1>${inlineFormat(line.slice(2))}</h1>`)
    } else if (/^[-*+]\s/.test(line)) {
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false }
      if (!inList) { result.push('<ul>'); inList = true }
      result.push(`<li>${inlineFormat(line.slice(2))}</li>`)
    } else if (/^\d+\.\s/.test(line)) {
      if (inList) { result.push('</ul>'); inList = false }
      if (!inOrderedList) { result.push('<ol>'); inOrderedList = true }
      result.push(`<li>${inlineFormat(line.replace(/^\d+\.\s/, ''))}</li>`)
    } else if (line.trim() === '') {
      closeList()
      result.push('')
    } else if (line.startsWith('> ')) {
      closeList()
      result.push(`<blockquote>${inlineFormat(line.slice(2))}</blockquote>`)
    } else if (/^---+$/.test(line.trim())) {
      closeList()
      result.push('<hr />')
    } else {
      closeList()
      result.push(`<p>${inlineFormat(line)}</p>`)
    }
  }

  closeList()
  if (inCode) {
    result.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  }

  return result.join('\n')
}

function inlineFormat(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}
