import { useState, type FormEvent, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import { admission, classChoices, inquiryUrl, site, type InquiryInput } from '../content';

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
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 py-3 text-base font-semibold text-white transition hover:bg-navy-soft"
      >
        <Send size={16} aria-hidden="true" />
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
