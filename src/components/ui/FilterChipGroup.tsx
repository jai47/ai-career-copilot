interface FilterChipGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function FilterChipGroup({
  label,
  options,
  selected,
  onChange,
}: FilterChipGroupProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  return (
    <div>
      <p className="text-[14px] font-medium text-slate-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={`px-2 py-1 text-[10px] rounded-xl border cursor-pointer ${
              selected.includes(option.value)
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-slate-500 hover:border-accent/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
