'use client';

import { useId, useRef, useState } from 'react';
import { Sun, Moon, Desktop, Check } from '@phosphor-icons/react';
import { useTheme, type ThemePreference } from './theme-provider';

const options = [
  { value: 'light', label: 'Light', detail: 'Warm, bright and clear', icon: Sun },
  { value: 'dark', label: 'Dark', detail: 'A softer evening view', icon: Moon },
  { value: 'system', label: 'System', detail: 'Follow your device', icon: Desktop },
] as const;

export function ThemePicker() {
  const { preference, resolved, setPreference } = useTheme();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 80, right: 24 });
  const Icon = preference === 'system' ? Desktop : resolved === 'dark' ? Moon : Sun;
  const select = (value: ThemePreference) => {
    setPreference(value);
    ref.current?.hidePopover();
  };
  return (
    <div className="theme-picker">
      <button
        className="theme-trigger icon-button"
        type="button"
        popoverTarget={id}
        aria-label="Theme settings"
        title={`Theme: ${preference}`}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setPosition({
            top: Math.min(bounds.bottom + 10, window.innerHeight - 220),
            right: Math.max(16, window.innerWidth - bounds.right),
          });
        }}
      >
        <Icon size={19} />
      </button>
      <div
        ref={ref}
        id={id}
        popover="auto"
        className="theme-popover"
        style={{ top: position.top, right: position.right }}
      >
        <span className="micro-label">YOUR PREFERRED PERSPECTIVE</span>
        <div role="group" aria-label="Color theme">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => select(option.value)}
              aria-pressed={preference === option.value}
            >
              <option.icon size={21} />
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
              {preference === option.value && <Check size={17} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
