/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { cacheSet } from "@/lib/cache";

const CONTRIBUTORS_CACHE_KEY = "ftp:contributors:v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, contributionId } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      contributionId: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !contributionId) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Verify HMAC SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const signaturesMatch =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex"),
      );

    if (!signaturesMatch) {
      // Mark as failed
      await prisma.contribution.update({
        where: { id: contributionId },
        data: { status: "failed" },
      });
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Mark as paid
    const contribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
    });

    // Also save to Supporter table (for admin /supporters view)
    try {
      await prisma.supporter.upsert({
        where: { paymentId: razorpay_payment_id },
        update: { status: "success" },
        create: {
          name: contribution.name,
          email: contribution.email ?? null,
          amount: contribution.amount / 100, // paise → rupees
          currency: contribution.currency,
          tier: contribution.tier ?? "one-time",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: "success",
          message: contribution.message ?? null,
        },
      });
    } catch (supporterErr) {
      console.error("[verify] Supporter upsert failed:", supporterErr);
    }

    // Invalidate contributors cache so wall refreshes immediately
    await cacheSet(CONTRIBUTORS_CACHE_KEY, null, 1);

    return NextResponse.json({ success: true, message: "Payment verified" });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
