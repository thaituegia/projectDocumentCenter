import React, { useEffect, useRef } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  Headphones,
  Video,
  Image,
  File,
  Check,
  LoaderCircle,
  Lock,
  Globe,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";
export function Button({
  children,
  kind = "primary",
  className = "",
  busy = false,
  ...p
}) {
  return (
    <button
      className={`button ${kind} ${className}`}
      {...p}
      disabled={busy || p.disabled}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function IconButton({ label, children, className = "", ...p }) {
  return (
    <button
      className={`icon-button ${className}`}
      title={label}
      aria-label={label}
      {...p}
    >
      {children}
    </button>
  );
}
export function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const node = ref.current;
    const initial = node?.querySelector("button,input,select,textarea,a[href]");
    (initial || node)?.focus();
    const key = (e) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== node) return;
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [
          ...node.querySelectorAll("button,input,select,textarea,a[href]"),
        ].filter((x) => !x.disabled);
        if (!els.length) return;
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton label="Đóng" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
const types = {
  PDF: FileText,
  PPTX: Presentation,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
  AUDIO: Headphones,
  VIDEO: Video,
  IMAGE: Image,
};
export function FileIcon({ type = "PDF", large = false }) {
  const Icon = types[type] || File;
  return (
    <div className={`file-icon ${type.toLowerCase()} ${large ? "large" : ""}`}>
      <Icon size={large ? 28 : 20} />
      <span>{type === "AUDIO" ? "MP3" : type === "VIDEO" ? "MP4" : type}</span>
    </div>
  );
}
export function AccessBadge({ access }) {
  return (
    <span
      className={`access-badge ${access === "PUBLIC" ? "public" : "private"}`}
    >
      {access === "PUBLIC" ? <Globe size={12} /> : <Lock size={12} />}{" "}
      {access === "PUBLIC" ? "Công khai" : "Riêng tư"}
    </span>
  );
}
export function Empty({
  icon: Icon = BookOpen,
  title = "Chưa có nội dung",
  description,
  children,
}) {
  return (
    <div className="empty">
      <span>
        <Icon size={32} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading">
      <LoaderCircle size={24} className="spin" /> Đang tải dữ liệu…
    </div>
  );
}
export function Stat({ icon: Icon, label, value, sub, color = "green" }) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`}>
        <Icon size={21} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}
export function BookArt() {
  return (
    <div className="book-art" aria-hidden="true">
      <div className="art-ring ring-one" />
      <div className="art-ring ring-two" />
      <div className="art-spark spark-one">✦</div>
      <div className="art-spark spark-two">✧</div>
      <div className="book book-back">
        <span>BACNHABOOK</span>
        <b>汉语</b>
        <em>HSK 2</em>
        <i>CHINESE LANGUAGE</i>
      </div>
      <div className="book book-front">
        <span>BACNHABOOK</span>
        <div className="book-rule" />
        <b>
          你好<span>Nǐ hǎo</span>
        </b>
        <em>
          Chạm vào
          <br />
          một ngôn ngữ mới.
        </em>
        <i>HSK 1 · KHỞI ĐẦU</i>
        <div className="book-sun" />
        <div className="book-hill hill-one" />
        <div className="book-hill hill-two" />
      </div>
      <div className="art-tag">
        <GraduationCap size={19} />
        <span>Học mỗi ngày, tiến xa hơn.</span>
      </div>
    </div>
  );
}
