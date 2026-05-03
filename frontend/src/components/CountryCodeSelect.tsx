import React from 'react';

const countryCodes = [
    { code: '+254', name: 'Kenya', flag: '🇰🇪' },
    { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
    { code: '+256', name: 'Uganda', flag: '🇺🇬' },
    { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
    { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
    { code: '+27', name: 'South Africa', flag: '🇿🇦' },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
    { code: '+233', name: 'Ghana', flag: '🇬🇭' },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
];

interface CountryCodeSelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({ value, onChange, className }) => {
    return (
        <select
            className={`select ${className}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '120px', flexShrink: 0 }}
        >
            {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                </option>
            ))}
        </select>
    );
};

export default CountryCodeSelect;
