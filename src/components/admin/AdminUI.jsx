import { cloneElement, useEffect, useId, useRef } from 'react';
import { ADMIN_PAGE_SIZE } from '../../utils/admin';

export function AdminButton({ children, variant = 'default', icon, className = '', ...props }) {
  return <button type="button" className={`admin-button admin-button-${variant} ${className}`} {...props}>
    {icon && <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>}{children}
  </button>;
}

export function AdminNotice({ children, tone = 'error', onDismiss }) {
  if (!children) return null;
  return <div className={`admin-notice admin-notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <span className="material-symbols-outlined" aria-hidden="true">{tone === 'error' ? 'error' : 'check_circle'}</span>
    <span className="min-w-0 flex-1">{children}</span>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Đóng thông báo" className="admin-icon-button">
      <span className="material-symbols-outlined" aria-hidden="true">close</span>
    </button>}
  </div>;
}

export function AdminBadge({ children, tone = 'neutral' }) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>;
}

export function AdminHeading({ title, description, children }) {
  return <header className="admin-page-heading">
    <div><h1>{title}</h1><p>{description}</p></div>{children}
  </header>;
}

export function AdminField({ label, error, hint, children }) {
  const id = useId();
  const inputId = children.props.id || id;
  return <div className="admin-field">
    <label htmlFor={inputId}>{label}</label>
    {cloneElement(children, {
      id: inputId,
      'aria-invalid': Boolean(error),
      'aria-describedby': error || hint ? `${id}-help` : undefined,
    })}
    {(error || hint) && <p id={`${id}-help`} className={error ? 'admin-field-error' : 'admin-hint'}>{error || hint}</p>}
  </div>;
}

export function AdminEmpty({ title = 'Chưa có dữ liệu', description, icon = 'inbox' }) {
  return <div className="admin-empty">
    <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
    <p className="font-bold">{title}</p>{description && <p className="admin-hint">{description}</p>}
  </div>;
}

export function AdminLoading() {
  return <div className="admin-empty" role="status"><span className="admin-spinner" aria-hidden="true" />Đang tải dữ liệu…</div>;
}

export function AdminPagination({ page, count, hasNext, loading, onChange }) {
  const start = (page - 1) * ADMIN_PAGE_SIZE + 1;
  return <nav className="admin-pagination" aria-label="Phân trang">
    <span>{count ? `Bản ghi ${start}–${start + count - 1}` : 'Chưa có bản ghi'} · Trang {page}</span>
    <div className="flex gap-2">
      <AdminButton icon="chevron_left" disabled={loading || page <= 1} onClick={() => onChange(page - 1)}>Trang trước</AdminButton>
      <AdminButton icon="chevron_right" disabled={loading || !hasNext} onClick={() => onChange(page + 1)}>Trang sau</AdminButton>
    </div>
  </nav>;
}

export function AdminModal({ title, children, onClose, busy = false, wide = false }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);
  return <dialog ref={ref} className={`admin-modal ${wide ? 'admin-modal-wide' : ''}`} aria-labelledby={id}
    aria-busy={busy} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="admin-modal-heading">
      <h2 id={id}>{title}</h2>
      <AdminButton icon="close" onClick={onClose} disabled={busy} aria-label="Đóng hộp thoại" />
    </div>
    <div className="admin-modal-body">{children}</div>
  </dialog>;
}
