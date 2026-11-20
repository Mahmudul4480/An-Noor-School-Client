import { useState, type FormEvent, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import { admission, classChoices, inquiryUrl, site, type InquiryInput } from '../content';

export function WhatsAppMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.64-.61-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.37.24-.28.64-.41.85-.41h.61c.2 0 .46-.04.72.55.27.61.91 2.1.99 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.31.4-.45.54-.14.14-.29.29-.12.57.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.44.12.61-.07.16-.19.7-.81.89-1.09.19-.28.38-.23.64-.14.26.09 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

const empty: InquiryInput = {
  guardian: '',
  child: '',
  className: '',
  phone: '',
  message: '',
};

export function InquiryForm({ id = 'inquiry' }: { id?: string }) {
  const [values, setValues] = useState<InquiryInput>(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const choices = classChoices();
  const mode = site.whatsapp ? 'WhatsApp' : 'email';

  function update(field: keyof InquiryInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: string[] = [];
    if (!values.guardian.trim()) next.push('Please enter the guardian’s name.');
    if (!values.className) next.push('Please choose a class.');
    if (values.phone.trim().length < 6) next.push('Please enter a phone number we can call back.');
    setErrors(next);
    if (next.length) {
      setStatus('');
      return;
    }
    const { href, mode: channel } = inquiryUrl(values);
    if (channel === 'whatsapp') {
      window.open(href, '_blank', 'noopener,noreferrer');
      setStatus('WhatsApp should open with your inquiry. If it does not, use the email address below.');
      return;
    }
    window.location.href = href;
    setStatus(`Your email app should open addressed to ${site.email}. If it does not, copy your message and write to that address.`);
  }

  return (
    <form id={id} onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm leading-relaxed text-ink/75">{admission.formText}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guardian’s name" required>
          <input
            name="guardian"
            autoComplete="name"
            value={values.guardian}
            onChange={(event) => update('guardian', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Child’s name">
          <input
            name="child"
            value={values.child}
            onChange={(event) => update('child', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Class of interest" required>
          <select
            name="class"
            value={values.className}
            onChange={(event) => update('className', event.target.value)}
            className={inputClass}
          >
            <option value="">Choose a class</option>
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
            <option value="Not sure yet">Not sure yet</option>
          </select>
        </Field>
        <Field label="Your phone" required>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Message">
        <textarea
          name="message"
          rows={4}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
          className={inputClass}
        />
      </Field>
      {errors.length > 0 && (
        <ul className="rounded-2xl bg-navy/5 px-4 py-3 text-sm text-navy-deep" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <button
        type="submit"
        className={
          site.whatsapp
            ? 'inline-flex min-h-12 items-center gap-2 rounded-full bg-[#075E54] px-6 py-3 text-base font-bold text-white shadow-[0_10px_24px_rgba(7,94,84,0.35)] transition hover:bg-[#064E48]'
            : 'inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 py-3 text-base font-semibold text-white transition hover:bg-navy-soft'
        }
      >
        {site.whatsapp ? <WhatsAppMark size={18} /> : <Send size={16} aria-hidden="true" />}
        Send by {mode}
      </button>
      {status && <p className="text-sm leading-relaxed text-navy">{status}</p>}
    </form>
  );
}

const inputClass =
  'w-full rounded-2xl border border-navy/15 bg-white px-3 py-3 text-base text-navy-deep outline-none focus:border-navy';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-navy-deep">
      <span>
        {label}
        {required && <span className="text-crest"> *</span>}
      </span>
      <span className="mt-1.5 block font-normal">{children}</span>
    </label>
  );
}
