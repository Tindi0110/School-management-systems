import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

const PasswordValidator = ({ password }: { password: string }) => {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Special character (@, $, !, etc.)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <div className="mt-3 space-y-2 p-4 bg-secondary/5 rounded-xl border border-secondary/10">
      <p className="text-[10px] font-black uppercase tracking-wider text-secondary mb-3">Security Requirements</p>
      {requirements.map((req, index) => (
        <div 
          key={index} 
          className={`flex items-center gap-2 transition-all duration-300 ${
            req.met ? 'text-success' : 'text-secondary opacity-60'
          }`}
        >
          <div className={`p-0.5 rounded-full ${req.met ? 'bg-success/20' : 'bg-secondary/10'}`}>
            {req.met ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
          </div>
          <span className="text-[11px] font-bold">{req.label}</span>
        </div>
      ))}
    </div>
  );
};

export default PasswordValidator;
