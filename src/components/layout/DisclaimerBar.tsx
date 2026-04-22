/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "ftp_disclaimer_v1";

export default function DisclaimerBar() {
  const t = useTranslations("site");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        background: "#FEF9C3",
        borderBottom: "1px solid #FDE68A",
        padding: "8px 16px",
        fontSize: 12,
        color: "#78350F",
        display: "flex",
        alignItems: "center",
        gap: 8,
        lineHeight: 1.5,
      }}
    >
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1 }}>
        <strong>{t("notice")}</strong>{" "}
        {t("verifyNotice")}
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss disclaimer"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
          color: "#92400E",
          padding: "0 4px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
