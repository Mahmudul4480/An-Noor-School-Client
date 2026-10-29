import React from 'react';

interface Props { children: React.ReactNode; onReset?: () => void; label?: string }
interface State { error: Error | null }

/** Shows a Bangla message instead of a white screen when a child crashes. */
export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;
  declare setState: (state: State) => void;
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error(`[${this.props.label ?? 'ErrorBoundary'}]`, error, info.componentStack); }
  reset = () => { this.setState({ error: null }); this.props.onReset?.(); };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="m-4 p-6 rounded-3xl border border-red-200 bg-red-50 text-center">
        <p className="text-base font-bold text-red-700">দুঃখিত, এই অংশটি দেখাতে সমস্যা হয়েছে।</p>
        <p className="text-sm text-red-600 mt-1">পেজটি রিফ্রেশ করুন অথবা আবার চেষ্টা করুন। সমস্যা থাকলে অ্যাডমিনকে জানান।</p>
        <p className="text-[10px] text-red-400 mt-2 break-all">{this.state.error.message}</p>
        <button type="button" onClick={this.reset} className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold">আবার চেষ্টা করুন</button>
      </div>
    );
  }
}
