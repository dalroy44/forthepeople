/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, amount, name, email, phone, districtId, stateId, socialLink, message } = body as {
      tier: string;
      amount: number;
      name: string;
      email?: string;
      phone?: string;
      districtId?: string;
      stateId?: string;
      socialLink?: string;
      message?: string;
    };

    // Validate phone (required for subscriptions — UPI AutoPay / e-mandate
    // needs a verified contact). 10-digit Indian number, strip +91 prefix.
    const phoneDigits = (phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: "Valid 10-digit phone number is required for subscriptions" },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tierConfig = TIER_CONFIG[tier];
    if (!tierConfig || !tierConfig.isRecurring) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    // Validate amount against tier bounds
    if (!Number.isFinite(amount) || amount < tierConfig.minAmount || amount > tierConfig.maxAmount) {
      return NextResponse.json(
        { error: `Amount must be between ₹${tierConfig.minAmount} and ₹${tierConfig.maxAmount.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    // Validate district/state requirements
    if (tierConfig.requiresDistrict && !districtId) {
      return NextResponse.json({ error: "District selection is required for this tier" }, { status: 400 });
    }
    if (tierConfig.requiresState && !stateId) {
      return NextResponse.json({ error: "State selection is required for this tier" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // ── Create a one-off Razorpay plan with the user's exact amount ──
    const planRes = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        period: "monthly",
        interval: 1,
        item: {
          name: `FTP ${tierConfig.name} ₹${amount}/mo`,
          amount: Math.round(amount * 100), // paise
          currency: "INR",
          description: tierConfig.description,
        },
      }),
    });

    if (!planRes.ok) {
      const errText = await planRes.text();
      console.error("[create-subscription] Plan creation failed:", errText);
      return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
    }

    const plan = await planRes.json();

    // Create Razorpay subscription using the dynamic plan
    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        plan_id: plan.id,
        total_count: 120, // up to 10 years
        customer_notify: 1, // Razorpay sends payment confirmation SMS + email
        notify_info: {
          notify_email: email?.trim() || undefined,
          notify_phone: `+91${phoneDigits}`,
        },
        notes: {
          name: name.trim(),
          email: email?.trim() || "",
          phone: phoneDigits,
          tier,
          amount: String(amount),
          districtId: districtId || "",
          stateId: stateId || "",
          socialLink: socialLink?.trim() || "",
          message: message?.trim().slice(0, 100) || "",
          platform: "forthepeople.in",
        },
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      console.error("[create-subscription] Razorpay subscription error:", err);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const data = await subRes.json();

    return NextResponse.json({
      subscriptionId: data.id,
      planId: plan.id,
      amount,
      shortUrl: data.short_url,
    });
  } catch (err) {
    console.error("[create-subscription]", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
