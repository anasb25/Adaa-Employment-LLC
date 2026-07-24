import { useState } from "react";
import Select from "../Select";

interface CountryCode {
  code: string;
  label: string;
}

interface PhoneInputProps {
  countries: CountryCode[];
  placeholder?: string;
  onChange?: (phoneNumber: string) => void;
  selectPosition?: "start" | "end";
}

const embeddedSelectClass =
  "h-11 border-0 bg-transparent shadow-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:focus:border-brand-800";

const PhoneInput: React.FC<PhoneInputProps> = ({
  countries,
  placeholder = "+1 (555) 000-0000",
  onChange,
  selectPosition = "start",
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [phoneNumber, setPhoneNumber] = useState<string>("+1");

  const countryCodes: Record<string, string> = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [code]: label }),
    {},
  );

  const countryOptions = countries.map((country) => ({
    value: country.code,
    label: country.code,
  }));

  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry);
    setPhoneNumber(countryCodes[newCountry]);
    if (onChange) {
      onChange(countryCodes[newCountry]);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    if (onChange) {
      onChange(newPhoneNumber);
    }
  };

  return (
    <div className="relative flex">
      {selectPosition === "start" && (
        <div className="absolute z-10 w-[84px]">
          <Select
            size="sm"
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            wrapperClassName="w-[84px]"
            className={`${embeddedSelectClass} rounded-l-lg rounded-r-none border-r border-gray-200 pr-7 dark:border-gray-700`}
          />
        </div>
      )}

      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
          selectPosition === "start" ? "pl-[84px]" : "pr-[84px]"
        }`}
      />

      {selectPosition === "end" && (
        <div className="absolute right-0 z-10 w-[84px]">
          <Select
            size="sm"
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            wrapperClassName="w-[84px]"
            className={`${embeddedSelectClass} rounded-r-lg rounded-l-none border-l border-gray-200 pr-7 dark:border-gray-700`}
          />
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
