import DOMPurify from 'dompurify'
import { marked } from 'marked'

const LOCATION_LINK = /\(https?:\/\/mapgenie\.io\/crimson-desert\/maps\/pywel\?locationIds=(\d+)\)/g

/** MapGenie descriptions link to other pins; point those links at this app instead. */
export function rewriteLocationLinks(md: string): string {
  return md.replace(LOCATION_LINK, '(#loc=$1)')
}

export function renderDescription(md: string): string {
  const html = marked.parse(rewriteLocationLinks(md), { async: false, breaks: true })
  return DOMPurify.sanitize(html)
}
