import React, { useEffect, useState } from 'react';
import { SCHOOL_LOGO_URL, getSchoolName, getSchoolLogoCircle } from '../lib/receipts';

/**
 * Shows the same circular, gold-ringed logo that the print and PDF receipts use,
 * falling back to the raw artwork inside a ringed frame until it is rendered.
 */
export function ReceiptLogo({ className = 'w-20 h-20' }: { className?: string }) {
  const [circle, setCircle] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSchoolLogoCircle().then((src) => {
      if (active) setCircle(src);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={`${className} rounded-full mx-auto mb-3 overflow-hidden ${
        circle ? '' : 'bg-white border-[3px] border-[#F8A41C]'
      }`}
    >
      <img
        src={circle ?? SCHOOL_LOGO_URL}
        alt={`${getSchoolName()} Logo`}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
}
