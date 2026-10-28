export type ToastKind = 'error' | 'warning' | 'success';
export interface ToastItem { id: number; kind: ToastKind; title: string; detail?: string }
type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();
let nextId = 1;
export function showToast(kind: ToastKind, title: string, detail?: string) {
  const t = { id: nextId++, kind, title, detail };
  listeners.forEach((l) => l(t));
}
export function subscribeToasts(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
