export interface ActorIdentity {
  email: string;
  name: string;
  uid: string;
  label: string;
}

const EMAIL_KEY = 'userEmail';
const NAME_KEY = 'userName';
const UID_KEY = 'userUid';

export function formatActorLabel(name?: string, email?: string): string {
  const displayName = name?.trim();
  const displayEmail = email?.trim().toLowerCase();
  if (displayName && displayEmail && displayName.toLowerCase() !== displayEmail) {
    return `${displayName} (${displayEmail})`;
  }
  if (displayEmail) return displayEmail;
  if (displayName) return displayName;
  return 'Unknown user';
}

export function persistActor(actor: { email?: string; name?: string; uid?: string }) {
  if (actor.email?.trim()) {
    localStorage.setItem(EMAIL_KEY, actor.email.trim().toLowerCase());
  }
  if (actor.name?.trim()) {
    localStorage.setItem(NAME_KEY, actor.name.trim());
  }
  if (actor.uid?.trim()) {
    localStorage.setItem(UID_KEY, actor.uid.trim());
  }
}

export function clearActor() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(UID_KEY);
}

export function getCurrentActor(): ActorIdentity {
  const email = localStorage.getItem(EMAIL_KEY) ?? '';
  const name = localStorage.getItem(NAME_KEY) ?? '';
  const uid = localStorage.getItem(UID_KEY) ?? '';
  return {
    email,
    name,
    uid,
    label: formatActorLabel(name, email),
  };
}

export function getCurrentActorLabel(fallback = 'Unknown user'): string {
  const actor = getCurrentActor();
  if (!actor.email && !actor.name) return fallback;
  return actor.label;
}
