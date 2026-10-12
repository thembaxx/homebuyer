'use client';
import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClose={onClose}
      closedby="any"
      aria-label={title}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">MAKE IT YOURS</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={23} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
