/** Bidirectional bridge between resume LaTeX and TipTap HTML. */

const PREAMBLE = String.raw`\documentclass[a4paper,8pt]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage[scale=0.9,top=.4in,bottom=.4in]{geometry}
\usepackage{tabularx}
\usepackage{array}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{fontawesome5}
\usepackage[normalem]{ulem}
\usepackage[colorlinks=true,urlcolor=black,linkcolor=black,citecolor=black]{hyperref}
\newcolumntype{C}{>{\centering\arraybackslash}X}
\titleformat{\section}{\Large\scshape\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{1pt}{2pt}{2pt}
\pagestyle{empty}
`;

function unescapeLatex(text: string): string {
  return text
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/\\ /g, ' ')
    .trim();
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1');
}

function stripCommands(text: string): string {
  return unescapeLatex(
    text
      .replace(/\\\\/g, ' ')
      .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
      .replace(/\\text(?:bf|it|sc|tt)\{([^}]*)\}/g, '$1')
      .replace(/\\(?:faEnvelope|faMobile|faGithub|faLinkedin)\s*/g, '')
      .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' '),
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function textOf(el: Element): string {
  return decodeHtml(el.textContent || '').replace(/\s+/g, ' ').trim();
}

function extractItems(chunk: string): string[] {
  return [...chunk.matchAll(/\\item\s+([\s\S]*?)(?=\\item|\\end\{itemize\}|$)/g)]
    .map((m) => stripCommands(m[1]))
    .filter(Boolean);
}

function pushItemList(parts: string[], items: string[]) {
  if (!items.length) return;
  parts.push('<ul style="margin:4px 0 10px;padding-left:1.2em;list-style-type:disc">');
  for (const item of items) {
    parts.push(`<li style="font-size:12.5px;margin:2px 0">${escapeHtml(item)}</li>`);
  }
  parts.push('</ul>');
}

function renderTabularxBlocks(parts: string[], content: string) {
  const blocks = content.split(/\\begin\{tabularx\}/);
  for (const block of blocks.slice(1)) {
    const [rawTable = '', after = ''] = block.split(/\\end\{tabularx\}/);
    // Prefer explicit commands — column specs like {@{}Xr@{}} confuse &-splitting.
    const left = stripCommands(rawTable.match(/\\textbf\{([^}]+)\}/)?.[1] || '');
    const right = stripCommands(
      rawTable.match(/\\textbf\{[^}]+\}\s*&\s*([^\\]*?)(?:\\\\|$)/)?.[1] || '',
    );
    const role = stripCommands(rawTable.match(/\\textit\{([^}]+)\}/)?.[1] || '');

    parts.push('<table style="width:100%;border-collapse:collapse;margin:6px 0 2px"><tbody>');
    parts.push(
      `<tr><td style="font-weight:700;font-size:13px;border:1px solid #e5e5e5;padding:6px 8px;background:#f8f8f8">${escapeHtml(left)}</td>` +
        `<td style="text-align:right;font-size:12px;border:1px solid #e5e5e5;padding:6px 8px;background:#f8f8f8;width:34%">${escapeHtml(right)}</td></tr>`,
    );
    if (role) {
      parts.push(
        `<tr><td colspan="2" style="font-style:italic;font-size:12px;border:1px solid #e5e5e5;padding:4px 8px">${escapeHtml(role)}</td></tr>`,
      );
    }
    parts.push('</tbody></table>');
    pushItemList(parts, extractItems(after));
  }
}

function renderSkills(parts: string[], content: string) {
  // Prefer labelled rows: \textbf{Languages:} Python\\ \textbf{Frontend:} React\\
  const labelled = [...content.matchAll(/\\textbf\{([^}]+)\}\s*([\s\S]*?)(?=\\textbf\{|\\begin\{|\\section\{|$)/g)];
  if (labelled.length) {
    for (const m of labelled) {
      const label = stripCommands(m[1]).replace(/:\s*$/, '');
      const value = stripCommands(m[2]);
      if (!label && !value) continue;
      parts.push(
        `<p style="font-size:12.5px;line-height:1.45;margin:0 0 4px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
      );
    }
    return;
  }

  const items = extractItems(content);
  if (items.length) {
    pushItemList(parts, items);
    return;
  }

  const plain = stripCommands(
    content
      .replace(/\\\\/g, '\n')
      .replace(/\\vspace\{[^}]*\}/g, '\n'),
  );
  if (plain) {
    parts.push(`<p style="font-size:12.5px;line-height:1.45;margin:0 0 8px">${escapeHtml(plain)}</p>`);
  }
}

/** Convert filled resume LaTeX into TipTap-friendly HTML. */
export function latexToHtml(source: string): string {
  const body = source
    .replace(/^[\s\S]*?\\begin\{document\}/, '')
    .replace(/\\end\{document\}[\s\S]*$/, '');

  // Name from Huge title
  const nameMatch = body.match(
    /\\Huge\s*\\textbf\{([^}]+)\}|\\textbf\{\\Huge\s*([^}]+)\}|\{\\Huge\s*\\textbf\{([^}]+)\}\}/,
  );
  const name = stripCommands(nameMatch?.[1] || nameMatch?.[2] || nameMatch?.[3] || 'Your Name');

  const email = body.match(/\\faEnvelope\\?\s*([^|$\\]+)/)?.[1]?.trim();
  const phone = body.match(/\\faMobile\\?\s*([^|$\\]+)/)?.[1]?.trim();
  const github = body.match(/\\href\{(https?:\/\/[^}]*)\}\{\\faGithub[^}]*\}/)?.[1];
  const linkedin = body.match(/\\href\{(https?:\/\/[^}]*)\}\{\\faLinkedin[^}]*\}/)?.[1];
  const contactParts = [
    phone && `☎ ${stripCommands(phone)}`,
    email && `✉ ${stripCommands(email)}`,
    linkedin && `in ${linkedin}`,
    github && `gh ${github}`,
  ].filter(Boolean);

  const parts: string[] = [
    `<h1 style="font-size:28px;text-align:center;margin:0 0 6px">${escapeHtml(name)}</h1>`,
  ];
  if (contactParts.length) {
    parts.push(
      `<p style="font-size:12px;text-align:center;color:#444;margin:0 0 14px">${escapeHtml(contactParts.join('  ·  '))}</p>`,
    );
  }

  const sectionChunks = body.split(/\\section\{([^}]+)\}/).slice(1);
  for (let i = 0; i < sectionChunks.length; i += 2) {
    const title = sectionChunks[i];
    const content = sectionChunks[i + 1] || '';
    parts.push(
      `<h2 style="font-size:15px;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1px solid #1d1d1f;padding-bottom:2px;margin:16px 0 8px">${escapeHtml(title)}</h2>`,
    );

    if (/Skills/i.test(title)) {
      renderSkills(parts, content);
      continue;
    }

    if (/\\begin\{tabularx\}/.test(content)) {
      renderTabularxBlocks(parts, content);
      continue;
    }

    if (/\\begin\{itemize\}/.test(content)) {
      pushItemList(parts, extractItems(content));
    } else {
      const plain = stripCommands(
        content
          .replace(/\\\\/g, '\n')
          .replace(/\\vspace\{[^}]*\}/g, '\n'),
      );
      if (plain) {
        parts.push(`<p style="font-size:12.5px;line-height:1.45;margin:0 0 8px">${escapeHtml(plain)}</p>`);
      }
    }
  }

  return parts.join('\n') || '<h1>Your Name</h1><p>Start editing…</p>';
}

/** Convert TipTap HTML back into the one-page resume LaTeX template. */
export function htmlToLatex(html: string): string {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return `${PREAMBLE}\\begin{document}\n\\end{document}\n`;

  const nameEl = root.querySelector('h1');
  const name = escapeLatex(textOf(nameEl as Element) || 'Resume');

  let contactP: Element | null = null;
  let cursor = nameEl?.nextElementSibling || null;
  while (cursor && cursor.tagName === 'P') {
    const text = textOf(cursor);
    // Drop legacy "Target: role @ company" lines — contact is the only subheading.
    if (
      cursor.getAttribute('data-resume-target') === '1' ||
      /^(Target|Applying)\b/i.test(text)
    ) {
      cursor = cursor.nextElementSibling;
      continue;
    }
    if (!contactP) contactP = cursor;
    cursor = cursor.nextElementSibling;
  }

  const contactText = contactP ? textOf(contactP) : '';

  const email = contactText.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0];
  const phone = contactText.match(/(?:\+?\d[\d\s()-]{7,}\d)/)?.[0];
  const linkedin = contactText.match(/https?:\/\/(?:www\.)?linkedin\.com\/\S+/i)?.[0];
  const github = contactText.match(/https?:\/\/(?:www\.)?github\.com\/\S+/i)?.[0];

  const segments: string[] = [];
  if (email) segments.push(`\\faEnvelope\\ ${escapeLatex(email)}`);
  if (phone) segments.push(`\\faMobile\\ ${escapeLatex(phone)}`);
  if (github) segments.push(`\\href{${github}}{\\faGithub\\ GitHub}`);
  if (linkedin) segments.push(`\\href{${linkedin}}{\\faLinkedin\\ LinkedIn}`);

  const out: string[] = [
    PREAMBLE.trimEnd(),
    '\\begin{document}',
    '\\begin{tabularx}{\\linewidth}{@{}C@{}}',
    `{\\Huge \\textbf{${name}}}\\\\[6pt]`,
  ];
  if (segments.length) out.push(segments.join(' $|$\n'));
  out.push('\\end{tabularx}');

  const children = Array.from(root.children);
  let i = 0;
  while (i < children.length) {
    const el = children[i];
    if (
      el === nameEl ||
      el === contactP ||
      el.getAttribute('data-resume-target') === '1' ||
      /^(Target|Applying)\b/i.test(textOf(el))
    ) {
      i += 1;
      continue;
    }
    if (el.tagName === 'H2') {
      const section = textOf(el) || 'Section';
      out.push(`\\section{${escapeLatex(section)}}`);
      i += 1;
      while (i < children.length && children[i].tagName !== 'H2') {
        const next = children[i];
        if (next.tagName === 'TABLE') {
          const rows = Array.from(next.querySelectorAll('tr'));
          const cells = rows[0] ? Array.from(rows[0].querySelectorAll('td,th')) : [];
          const left = escapeLatex(textOf(cells[0] as Element) || '');
          const right = escapeLatex(textOf(cells[1] as Element) || '');
          const role = rows[1] ? escapeLatex(textOf(rows[1])) : '';
          out.push('\\begin{tabularx}{\\linewidth}{@{}Xr@{}}');
          out.push(`\\textbf{${left}} & ${right}\\\\`);
          if (role) out.push(`\\textit{${role}} & \\\\`);
          out.push('\\end{tabularx}');
        } else if (next.tagName === 'UL') {
          out.push('\\begin{itemize}[leftmargin=1.4em,itemsep=1pt,topsep=2pt,parsep=0pt]');
          for (const li of Array.from(next.querySelectorAll(':scope > li'))) {
            const t = escapeLatex(textOf(li));
            if (t) out.push(`\\item ${t}`);
          }
          out.push('\\end{itemize}');
        } else if (next.tagName === 'P') {
          const strong = next.querySelector('strong');
          const full = textOf(next);
          if (strong && /Skills/i.test(section)) {
            const label = textOf(strong).replace(/:\s*$/, '');
            const value = full.startsWith(label)
              ? full.slice(label.length).replace(/^:\s*/, '')
              : full.replace(/^[^:]+:\s*/, '');
            out.push(`\\textbf{${escapeLatex(label)}:} ${escapeLatex(value)}\\\\`);
          } else {
            const t = escapeLatex(full);
            if (t) out.push(t);
          }
        }
        i += 1;
      }
      continue;
    }
    i += 1;
  }

  out.push('\\end{document}');
  return out.join('\n');
}

export { PREAMBLE as RESUME_LATEX_PREAMBLE };
