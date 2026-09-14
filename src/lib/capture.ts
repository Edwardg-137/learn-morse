export function isTypingTarget(target: EventTarget | null | { tagName?: string; isContentEditable?: boolean }): boolean {
  if (!target || typeof target !== 'object') return false;
  const tag = 'tagName' in target && target.tagName ? String(target.tagName).toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return true;
  return Boolean('isContentEditable' in target && target.isContentEditable);
}

export function matchesCaptureKey(eventKey: string, captureKey: string) {
  if (captureKey === ' ' || captureKey === 'Enter') return eventKey === captureKey;
  return eventKey.toLowerCase() === captureKey.toLowerCase();
}

export function shouldCaptureMorse(
  event: { key: string; repeat?: boolean; target?: EventTarget | null | { tagName?: string; isContentEditable?: boolean } },
  captureKey: string,
  disabled: boolean,
) {
  if (disabled || event.repeat) return false;
  if (!matchesCaptureKey(event.key, captureKey)) return false;
  return !isTypingTarget(event.target ?? null);
}
