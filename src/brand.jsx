import React from "react";
import { BookOpen } from "lucide-react";

export function Brand({ compact = false }) {
  return (
    <span className={`brand-lockup ${compact ? "brand-compact" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        <BookOpen strokeWidth={1.8} />
      </span>
      <span className="brand-wordmark">
        <strong>BÁC NHÃ BOOKS</strong>
        <small>Bác học Đa văn Trí huệ</small>
      </span>
    </span>
  );
}

export function EducationBrand() {
  return (
    <span className="education-brand">
      <strong>THANHMAIHSK</strong>
      <small>HỌC TIẾNG TRUNG</small>
    </span>
  );
}

export function DocumentWatermark({ identity }) {
  return (
    <div className="watermark branded-watermark" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i}>
          <strong>BÁC NHÃ BOOKS</strong>
          <b>THANHMAIHSK</b>
          <small>{identity}</small>
        </span>
      ))}
    </div>
  );
}
