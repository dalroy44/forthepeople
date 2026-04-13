/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";
import { validateSocialLink } from "@/lib/social-detect";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export interface TierConfig {
  emoji: string;
  label: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  step: number;
  accent: string;
  isMonthly?: boolean;
  isCustom?: boolean;
  tierKey: string;
  requiresDistrict?: boolean;
  requiresState?: boolean;
  hookLine?: string;
}

type Step = "idle" | "form" | "processing" | "success" | "error";

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`
    );
    if (existing) {
      if (window.Razorpay) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

interface Props {
  tier: TierConfig;
}

export default function SupportCheckout({ tier }: Props) {
  let queryClient: QueryClient | null = null;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = null;
  }

  function invalidateContributorQueries() {
    if (!queryClient) return;
    queryClient.invalidateQueries({ queryKey: ["contributors"] });
    queryClient.invalidateQueries({ queryKey: ["contributors-all"] });
    queryClient.invalidateQueries({ queryKey: ["district-sponsors"] });
    queryClient.invalidateQueries({ queryKey: ["homepage-preview"] });
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState(tier.defaultAmount);
  const [amountStr, setAmountStr] = useState(String(tier.defaultAmount));
  const [step, setStep] = useState<Step>("idle");
  const [scriptReady, setScriptReady] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [socialLink, setSocialLink] = useState("");

  // District/State selection
  const searchParams = useSearchParams();
  const paramTier = searchParams.get("tier");
  const paramState = searchParams.get("state");
  const paramDistrict = searchParams.get("district");

  const [selectedState, setSelectedState] = useState(paramTier === tier.tierKey && paramState ? paramState : "");
  const [selectedDistrict, setSelectedDistrict] = useState(paramTier === tier.tierKey && paramDistrict ? paramDistrict : "");

  // Success data
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  // Auto-open form if URL params match this tier, then scroll into view
  useEffect(() => {
    if (paramTier === tier.tierKey) {
      setStep("form");
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [paramTier, tier.tierKey]);

  const socialDetect = useMemo(() => validateSocialLink(socialLink), [socialLink]);
  const detectedPlatform = socialDetect.platform;
  const SocialIcon = detectedPlatform ? SOCIAL_ICONS[detectedPlatform] : null;
  const isVerified = !!detectedPlatform && !socialDetect.warning;
  const hasWarning = !!socialDetect.warning;

  const stateOptions = useMemo(() => INDIA_STATES, []);
  const districtOptions = useMemo(() => {
    if (!selectedState) return [];
    const state = INDIA_STATES.find((s) => s.slug === selectedState);
    return state?.districts ?? [];
  }, [selectedState]);

  // For subscription tiers, get the DB IDs via a lookup
  const [stateDbId, setStateDbId] = useState<string | null>(null);
  const [districtDbId, setDistrictDbId] = useState<string | null>(null);

  // Resolve slugs to DB IDs when selection changes
  useEffect(() => {
    if (selectedState && (tier.requiresState || tier.requiresDistrict)) {
      fetch(`/api/data/resolve-ids?state=${selectedState}&district=${selectedDistrict || ""}`)
        .then((r) => r.json())
        .then((data) => {
          setStateDbId(data.stateId ?? null);
          setDistrictDbId(data.districtId ?? null);
        })
        .catch(() => {});
    }
  }, [selectedState, selectedDistrict, tier.requiresState, tier.requiresDistrict]);

  function handleAmountBlur() {
    const parsed = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
    const base = Number.isFinite(parsed) ? parsed : tier.minAmount;
    const clamped = Math.max(tier.minAmount, Math.min(base, tier.maxAmount));
    const rounded = Math.round(clamped / tier.step) * tier.step;
    const final = Math.max(tier.minAmount, Math.min(rounded, tier.maxAmount));
    setAmount(final);
    setAmountStr(String(final));
  }

  function adjust(delta: number) {
    const next = Math.max(tier.minAmount, Math.min(tier.maxAmount, amount + delta));
    setAmount(next);
    setAmountStr(String(next));
  }

  const showDistrictSelector = tier.requiresDistrict || (!tier.isMonthly && !tier.isCustom);
  const showStateSelector = tier.requiresState || tier.requiresDistrict || (!tier.isMonthly && !tier.isCustom);
  const districtRequired = !!tier.requiresDistrict;
  const stateRequired = !!tier.requiresState;

  const canSubmit =
    name.trim() &&
    scriptReady &&
    (!districtRequired || selectedDistrict) &&
    (!stateRequired || selectedState);

  async function handlePay() {
    if (!canSubmit) return;
    setStep("processing");

    try {
      if (tier.isMonthly) {
        // ── Subscription flow ──────────────────────────────
        const res = await fetch("/api/payment/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: tier.tierKey,
            amount, // user-chosen amount from +/- buttons
            name: name.trim(),
            email: email.trim() || undefined,
            districtId: districtDbId || undefined,
            stateId: stateDbId || undefined,
            socialLink: socialLink.trim() || undefined,
            message: message.trim() || undefined,
          }),
        });

        if (!res.ok) throw new Error("Subscription creation failed");
        const { subscriptionId } = await res.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: "ForThePeople.in",
          description: tier.label,
          prefill: { name: name.trim(), email: email.trim() },
          theme: { color: tier.accent },
          modal: {
            ondismiss: () => setStep("form"),
          },
          handler: async (response: {
            razorpay_subscription_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyRes = await fetch("/api/payment/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name: name.trim(),
                email: email.trim() || undefined,
                tier: tier.tierKey,
                amount,
                districtId: districtDbId || undefined,
                stateId: stateDbId || undefined,
                socialLink: socialLink.trim() || undefined,
                message: message.trim() || undefined,
                isPublic,
              }),
            });
            const data = await verifyRes.json();
            if (data.success) {
              setPaidAmount(amount);
              setStep("success");
              // Instantly invalidate all contributor queries so walls refresh
              invalidateContributorQueries();
            } else {
              setStep("error");
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => setStep("error"));
        rzp.open();
        setStep("form");
      } else {
        // ── One-time payment flow ──────────────────────────
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            tier: tier.tierKey || tier.label,
            name: name.trim(),
            email: email.trim() || undefined,
            message: message.trim() || undefined,
            isPublic,
          }),
        });

        if (!res.ok) throw new Error("Order failed");
        const { orderId, amount: orderAmount, currency, contributionId } = await res.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderAmount,
          currency,
          name: "ForThePeople.in",
          description: tier.label,
          order_id: orderId,
          prefill: { name: name.trim(), email: email.trim() },
          theme: { color: tier.accent },
          modal: {
            ondismiss: () => setStep("form"),
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                contributionId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaidAmount(amount);
              setStep("success");
              // Instantly invalidate all contributor queries so walls refresh
              invalidateContributorQueries();
            } else {
              setStep("error");
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => setStep("error"));
        rzp.open();
        setStep("form");
      }
    } catch {
      setStep("error");
    }
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────
  if (step === "success") {
    const shareText = `I just ${tier.isMonthly ? "subscribed to" : "contributed ₹" + paidAmount.toLocaleString("en-IN") + " to"} ForThePeople.in — a free platform that brings government data to every Indian citizen!`;
    const shareUrl = "https://forthepeople.in/support";
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    // Build contributors page URL if district context available
    const contributorsUrl = selectedState && selectedDistrict
      ? `/en/${selectedState}/${selectedDistrict}/contributors?just_paid=true`
      : "/en";

    return (
      <div style={{ textAlign: "center", padding: "24px 16px" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", marginBottom: 6 }}>
          Thank You!
        </div>
        <div style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 6 }}>
          {tier.isMonthly
            ? `Your ₹${paidAmount.toLocaleString("en-IN")}/month subscription is now active.`
            : `Your ₹${paidAmount.toLocaleString("en-IN")} contribution helps keep ForThePeople.in running.`}
        </div>
        <div style={{ fontSize: 12, color: "#16A34A", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 12px", marginBottom: 10, lineHeight: 1.6 }}>
          Your name will appear on the contributors page within a minute.
        </div>
        <div style={{ fontSize: 11, color: "#6B6B6B", background: "#FAFAF8", border: "1px solid #E8E8E4", borderRadius: 8, padding: "8px 12px", marginBottom: 16, lineHeight: 1.6 }}>
          Want to update your social link or display name later? Email{" "}
          <a href="mailto:support@forthepeople.in" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
            support@forthepeople.in
          </a>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
            style={{ padding: "9px 18px", background: "#25D366", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Share on WhatsApp
          </a>
          <a href={twitterHref} target="_blank" rel="noopener noreferrer"
            style={{ padding: "9px 18px", background: "#1DA1F2", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Share on X
          </a>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={contributorsUrl}
            style={{ fontSize: 13, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
            View Contributors →
          </Link>
          <Link href="/en" style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none" }}>
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // ── FORM STEP ─────────────────────────────────────────────
  if (step === "form" || step === "processing") {
    const isLoading = step === "processing";
    return (
      <div ref={containerRef} style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 12 }}>
          Almost there — just your name!
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text" placeholder="Your Name *" value={name}
            onChange={(e) => setName(e.target.value)} maxLength={50}
            style={{ padding: "9px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFAF8" }}
          />
          <input
            type="email" placeholder="Email (optional — for receipt)" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "9px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFAF8" }}
          />

          {/* Social link */}
          <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6B6B", marginTop: 2 }}>Social media link (optional)</div>
          <div style={{ position: "relative" }}>
            <input
              type="url" placeholder="Your profile URL or @handle" value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              style={{ padding: "9px 12px", paddingRight: SocialIcon ? 36 : 12, border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFAF8", width: "100%", boxSizing: "border-box" }}
            />
            {SocialIcon && (
              <SocialIcon
                size={16}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#6B6B6B" }}
              />
            )}
          </div>
          <div style={{ fontSize: 11, marginTop: -6, paddingLeft: 2, color: isVerified ? "#16A34A" : hasWarning ? "#D97706" : !socialDetect.valid ? "#DC2626" : "#9B9B9B" }}>
            {isVerified && detectedPlatform
              ? `✓ ${detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} link detected — will be shown next to your name`
              : hasWarning
                ? `⚠ ${socialDetect.warning}`
                : !socialDetect.valid
                  ? "✗ Invalid link format"
                  : "Your link will be displayed next to your name. Works with Instagram, LinkedIn, GitHub, Twitter, or any website."}
          </div>

          {/* State selector (for district/state tiers, optional for others) */}
          {showStateSelector && (
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(""); }}
              style={{ padding: "9px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFAF8", color: selectedState ? "#1A1A1A" : "#9B9B9B" }}
            >
              <option value="">{stateRequired ? "Select State *" : "Associate with a state (optional)"}</option>
              {stateOptions.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          )}

          {/* District selector */}
          {showDistrictSelector && selectedState && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFAF8", color: selectedDistrict ? "#1A1A1A" : "#9B9B9B" }}
            >
              <option value="">{districtRequired ? "Select District *" : "Select District (optional)"}</option>
              {districtOptions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.active ? "● " : "🔒 "}{d.name}{!d.active ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
          )}

          {/* Show message for locked districts */}
          {selectedDistrict && districtOptions.find((d) => d.slug === selectedDistrict && !d.active) && (
            <div style={{ fontSize: 12, color: "#1E40AF", background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "10px 12px", borderRadius: 8, lineHeight: 1.6 }}>
              🔒 This district isn&apos;t live yet. Your sponsorship will activate the moment we launch it — your name will be the first on the page.
            </div>
          )}

          <input
            type="text" placeholder="Message (optional, max 100 chars)" value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 100))}
            style={{ padding: "9px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, outline: "none", background: "#FAFAF8" }}
          />

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B6B6B", lineHeight: 1.5 }}>
              Show my contribution publicly<br />
              <span style={{ color: "#9B9B9B" }}>(unchecked = shown as &quot;Anonymous&quot;)</span>
            </span>
          </label>
        </div>

        {tier.isMonthly && (
          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 8, lineHeight: 1.5 }}>
            Auto-debits monthly via UPI/Card. Cancel anytime.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setStep("idle")} disabled={isLoading}
            style={{ padding: "10px 14px", background: "#F5F5F0", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 12, color: "#6B6B6B", cursor: "pointer", flexShrink: 0 }}>
            ← Back
          </button>
          <button
            onClick={handlePay}
            disabled={!canSubmit || isLoading}
            style={{
              flex: 1, padding: "10px", background: !canSubmit || isLoading ? "#9B9B9B" : tier.accent,
              color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: !canSubmit || isLoading ? "default" : "pointer", transition: "background 150ms ease",
            }}>
            {isLoading ? "Opening payment…" : tier.isMonthly
              ? `Subscribe ₹${amount.toLocaleString("en-IN")}/month →`
              : `Contribute ₹${amount.toLocaleString("en-IN")} →`}
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR STEP ────────────────────────────────────────────
  if (step === "error") {
    return (
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div style={{ fontSize: 13, color: "#DC2626", marginBottom: 12 }}>
          Payment failed or was cancelled.
        </div>
        <button onClick={() => setStep("idle")}
          style={{ padding: "9px 20px", background: tier.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Try again
        </button>
      </div>
    );
  }

  // ── IDLE STEP (amount input + contribute button) ───────────
  return (
    <div>
      {/* Editable amount row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <button onClick={() => adjust(-tier.step)} disabled={amount <= tier.minAmount}
          style={{ width: 28, height: 28, border: "1px solid #E8E8E4", borderRadius: 6, background: "#F5F5F0", cursor: amount <= tier.minAmount ? "not-allowed" : "pointer", fontSize: 16, color: "#6B6B6B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: amount <= tier.minAmount ? 0.5 : 1 }}>
          −
        </button>
        <div style={{ display: "flex", alignItems: "center", flex: 1, background: "#FAFAF8", border: "1px solid #E8E8E4", borderRadius: 8, padding: "6px 10px" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: tier.accent, marginRight: 4 }}>₹</span>
          <input
            type="number" min={tier.minAmount} max={tier.maxAmount} step={tier.step} value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            onBlur={handleAmountBlur}
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 16, fontWeight: 800, color: "#1A1A1A", fontFamily: "var(--font-mono, monospace)", outline: "none", minWidth: 0 }}
          />
          {tier.isMonthly && <span style={{ fontSize: 11, color: "#9B9B9B" }}>/mo</span>}
        </div>
        <button onClick={() => adjust(tier.step)} disabled={amount >= tier.maxAmount}
          style={{ width: 28, height: 28, border: "1px solid #E8E8E4", borderRadius: 6, background: "#F5F5F0", cursor: amount >= tier.maxAmount ? "not-allowed" : "pointer", fontSize: 16, color: "#6B6B6B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: amount >= tier.maxAmount ? 0.5 : 1 }}>
          +
        </button>
      </div>

      <button onClick={() => setStep("form")} disabled={!scriptReady}
        style={{ display: "block", width: "100%", textAlign: "center", padding: "10px", background: tier.accent, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "opacity 150ms ease", opacity: scriptReady ? 1 : 0.7 }}>
        {tier.isMonthly
          ? `Subscribe ₹${amount.toLocaleString("en-IN")}/mo`
          : `Contribute ₹${amount.toLocaleString("en-IN")}`}
      </button>
    </div>
  );
}

// Export timeAgo for use in ContributorWall
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
