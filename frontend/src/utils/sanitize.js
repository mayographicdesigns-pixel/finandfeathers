import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Use this instead of raw dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'img'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt'],
  });
}

/**
 * Create a safe dangerouslySetInnerHTML prop.
 * Usage: <div {...safeHtml(htmlString)} />
 */
export function safeHtml(dirty) {
  return { dangerouslySetInnerHTML: { __html: sanitizeHtml(dirty) } };
}
