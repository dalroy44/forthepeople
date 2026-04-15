/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// News Action Engine — execute DB mutations from news classifications
// High confidence (>0.85): auto-execute | Mid (0.60-0.85): queue for review
// ═══════════════════════════════════════════════════════════
import { prisma } from "./db";
import { Prisma } from "@/generated/prisma";
import { callAI } from "./ai-provider";
import { extractExamFromNews, syncExamFromNews } from "./exam-sync";
import { extractVerifyAndSyncInfra } from "./infra-sync";

// ── Per-cron extraction cap ─────────────────────────────────
// Each news cron invocation calls resetExtractionCounters() once at start.
// Inside executeNewsAction, the infrastructure case bails out after 10 AI
// extractions so a burst of infra-tagged articles can't blow through the
// free-tier quota in a single run.
const EXTRACTION_CAPS = {
  infrastructure: 10,
} as const;
let infraExtractionsThisRun = 0;
export function resetExtractionCounters() {
  infraExtractionsThisRun = 0;
}

export interface NewsClassification {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  districtId: string;
  targetModule: string;
  moduleAction: string;
  extractedData: Record<string, unknown>;
  confidence: number;
}

// ── Enhanced AI classification with data extraction ─────────
export async function classifyArticleWithAI(
  title: string,
  source: string,
  districtName: string,
  publishedAt?: Date
): Promise<{
  targetModule: string;
  moduleAction: string;
  confidence: number;
  extractedData: Record<string, unknown>;
  provider: string;
} | null> {
  const today = new Date().toISOString().split("T")[0];
  const articleDate = publishedAt ? publishedAt.toISOString().split("T")[0] : today;
  const ageDays = publishedAt
    ? Math.floor((Date.now() - publishedAt.getTime()) / 86400000)
    : 0;

  const prompt = `Classify this news article for ${districtName} district and extract structured data.

Article: "${title}"
Source: ${source}
Article date: ${articleDate}
Today: ${today}

CRITICAL DATE RULE: This article is ${ageDays} day(s) old.
- If the article reports an event that ALREADY HAPPENED more than 2 days ago → set module to "news", confidence ≤ 0.4, NO alerts/actions.
- If the event is CURRENT or UPCOMING → classify normally and create appropriate actions.
- Never create alerts for past incidents (crimes, accidents, disasters from >2 days ago).

Classify into one of these modules:
leaders, infrastructure, budget, water, crops, weather, police, elections,
education, health, transport, schemes, housing, power, courts, industries,
jjm, gram-panchayat, alerts, sugar-factory, soil, population, news, exams, staffing

Return ONLY valid JSON (no markdown):
{
  "targetModule": "alerts",
  "moduleAction": "Security restrictions at Melkote event",
  "confidence": 0.92,
  "extractedData": {}
}

Module-specific extractedData fields:
- alerts: {"alertType":"security","alertTitle":"...","alertDescription":"...","location":"...","severity":"warning","startDate":"2026-03-28","endDate":"2026-03-29"}
- infrastructure: {"projectName":"...","budgetCrores":120,"status":"Announced","category":"Road","progressPct":0}
- police: {"crimeCategory":"theft","count":15,"description":"..."}
- schemes: {"schemeName":"PM Kisan","beneficiaryCount":5000}
- leaders: {"personName":"...","role":"District Collector","party":null,"tier":2}
- health: {"alertTitle":"...","description":"...","severity":"info"}
- water: {"damName":"KRS","storagePct":72,"waterLevel":110.5,"inflow":1200,"outflow":800}
- power: {"area":"Mandya city","type":"Scheduled","reason":"...","startTime":"2026-03-29T06:00","endTime":"2026-03-29T09:00"}
- elections: {"alertTitle":"...","description":"..."}
- exams: {"examTitle":"...","department":"...","vacancies":500,"status":"open","applyUrl":"https://..."}
- staffing: {"module":"health|police|schools","department":"Primary Health Centre","roleName":"Doctors","sanctionedPosts":10,"workingStrength":8,"vacantPosts":2}

Use "news" module if it doesn't clearly fit another. confidence = how certain you are (0-1).`;

  try {
    const response = await callAI({
      systemPrompt: "You are a news classifier. Return ONLY valid JSON. No markdown, no explanation.",
      userPrompt: prompt,
      purpose: "news-analysis",
      jsonMode: true,
      maxTokens: 1024,
      temperature: 0.1,
    });
    const text = response.text.trim().replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(text);
    return {
      targetModule: parsed.targetModule ?? "news",
      moduleAction: parsed.moduleAction ?? "",
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      extractedData: parsed.extractedData ?? {},
      provider: response.provider,
    };
  } catch {
    return null;
  }
}

// ── Execute DB mutation based on module ──────────────────────
export async function executeNewsAction(
  classification: NewsClassification
): Promise<void> {
  const { districtId, targetModule, extractedData, articleTitle, articleUrl, confidence } = classification;

  // Below threshold: skip
  if (confidence < 0.60) {
    console.log(`[NewsAction] Skip (low confidence ${confidence.toFixed(2)}): ${articleTitle.slice(0, 60)}`);
    return;
  }

  // Mid confidence: queue for admin review
  if (confidence < 0.85) {
    await prisma.newsActionQueue.create({
      data: {
        districtId,
        dataType: targetModule,
        extractedData: extractedData as unknown as Prisma.InputJsonValue,
        sourceUrl: articleUrl,
        headline: articleTitle,
        confidence,
        status: "pending",
      },
    });
    console.log(`[NewsAction] Queued review: ${targetModule} — ${articleTitle.slice(0, 60)}`);
    return;
  }

  // High confidence: auto-execute
  try {
    switch (targetModule) {
      case "alerts":
      case "health":
      case "elections": {
        const data = extractedData as Record<string, string>;
        const alertType = targetModule === "health" ? "health_advisory"
          : targetModule === "elections" ? "election"
          : (data.alertType ?? "general");
        await prisma.localAlert.create({
          data: {
            districtId,
            type: alertType,
            title: data.alertTitle ?? articleTitle,
            description: data.alertDescription ?? data.description ?? `Based on news: ${articleTitle}`,
            location: data.location ?? null,
            severity: (data.severity ?? "info") as string,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : null,
            active: true,
            sourceUrl: articleUrl,
            autoGenerated: true,
          },
        });
        console.log(`[NewsAction] ✅ Created LocalAlert: ${alertType} for ${targetModule}`);
        break;
      }

      case "infrastructure": {
        // News-driven infra sync: extract → verify → fuzzy upsert + timeline entry.
        // Non-fatal on failure — the NewsItem still persists via the outer pipeline.
        if (infraExtractionsThisRun >= EXTRACTION_CAPS.infrastructure) {
          console.log(
            `[NewsAction] infra: per-cron cap of ${EXTRACTION_CAPS.infrastructure} reached — skipping "${articleTitle.slice(0, 60)}"`
          );
          break;
        }
        infraExtractionsThisRun++;
        try {
          const result = await extractVerifyAndSyncInfra(
            { title: articleTitle, url: articleUrl, publishedAt: new Date() },
            districtId
          );
          if (!result) {
            console.log(`[NewsAction] infra: skipped (no projectName / low confidence / verify fail): ${articleTitle.slice(0, 60)}`);
          } else {
            console.log(
              `[NewsAction] ✅ Infra sync: created ${result.created}, updated ${result.updatedProjects}, ` +
              `timeline +${result.timelineCreated}, deduped ${result.duplicatesSkipped} across ${result.projectsTouched} districts`
            );
          }
        } catch (err) {
          console.error(
            "[NewsAction] infra sync failed:",
            err instanceof Error ? err.message : err
          );
        }
        break;
      }

      case "police": {
        const data = extractedData as Record<string, unknown>;
        if (data.crimeCategory && data.count) {
          const year = new Date().getFullYear();
          const existing = await prisma.crimeStat.findFirst({
            where: { districtId, year, category: data.crimeCategory as string },
          });
          if (existing) {
            await prisma.crimeStat.update({
              where: { id: existing.id },
              data: { count: data.count as number, source: articleUrl },
            });
          } else {
            await prisma.crimeStat.create({
              data: {
                districtId,
                year,
                category: data.crimeCategory as string,
                count: data.count as number,
                source: articleUrl,
              },
            });
          }
          console.log(`[NewsAction] ✅ Updated CrimeStat: ${data.crimeCategory}`);
        }
        break;
      }

      case "schemes": {
        const data = extractedData as Record<string, unknown>;
        if (data.schemeName) {
          const namePrefix = (data.schemeName as string).split(" ").slice(0, 3).join(" ");
          const scheme = await prisma.scheme.findFirst({
            where: {
              districtId,
              name: { contains: namePrefix, mode: "insensitive" },
            },
          });
          if (scheme && data.beneficiaryCount) {
            await prisma.scheme.update({
              where: { id: scheme.id },
              data: {
                beneficiaryCount: data.beneficiaryCount as number,
                source: articleUrl,
              },
            });
            console.log(`[NewsAction] ✅ Updated Scheme: ${scheme.name}`);
          }
        }
        break;
      }

      case "leaders": {
        const data = extractedData as Record<string, unknown>;
        if (data.personName && data.role) {
          const name = (data.personName as string).trim();
          const role = (data.role as string).trim();
          const tier = (data.tier as number) ?? 3;
          const party = (data.party as string) ?? null;

          // Skip duplicates: check if this name+role combo already exists for this district.
          const existing = await prisma.leader.findFirst({
            where: { districtId, name, role },
          });
          if (existing) {
            // Bump verification timestamp so the page shows a fresh date.
            await prisma.leader.update({
              where: { id: existing.id },
              data: { lastVerifiedAt: new Date(), active: true },
            });
            console.log(`[NewsAction] ⏭️  Skipped duplicate Leader (refreshed lastVerifiedAt): ${name} as ${role}`);
            break;
          }

          // For unique-officeholder roles (CM, Governor, Collector,
          // Commissioner, Mayor, etc.), mark the previous holder of the
          // SAME role inactive — never delete, so we preserve history.
          const UNIQUE_ROLE_RE = /^(chief minister|governor|lieutenant governor|deputy chief minister|chief secretary|district collector|deputy commissioner|district magistrate|mayor|commissioner of police|managing director|chairman|vice chairman|chief justice|principal sessions judge)/i;
          if (UNIQUE_ROLE_RE.test(role)) {
            const supersedeWhere = { districtId, role, active: true, NOT: { name } };
            const superseded = await prisma.leader.findMany({ where: supersedeWhere, select: { id: true, name: true } });
            if (superseded.length > 0) {
              await prisma.leader.updateMany({ where: { id: { in: superseded.map((s) => s.id) } }, data: { active: false } });
              console.log(`[NewsAction] 📜 Marked ${superseded.length} previous "${role}" holder(s) inactive: ${superseded.map((s) => s.name).join(", ")}`);
            }
          }

          await prisma.leader.create({
            data: {
              districtId, name, role, tier, party,
              since: new Date().getFullYear().toString(),
              source: articleUrl,
              lastVerifiedAt: new Date(),
              active: true,
            },
          });
          console.log(`[NewsAction] ✅ Added Leader: ${name} as ${role}`);
        }
        break;
      }

      case "power": {
        const data = extractedData as Record<string, unknown>;
        if (data.area) {
          await prisma.powerOutage.create({
            data: {
              districtId,
              area: data.area as string,
              type: (data.type as string) ?? "Unscheduled",
              reason: (data.reason as string) ?? articleTitle,
              startTime: data.startTime ? new Date(data.startTime as string) : new Date(),
              endTime: data.endTime ? new Date(data.endTime as string) : null,
              source: articleUrl,
              active: true,
            },
          });
          console.log(`[NewsAction] ✅ Created PowerOutage: ${data.area}`);
        }
        break;
      }

      case "exams": {
        // News-driven exam sync — extract structured metadata then upsert.
        // Failure is non-fatal: the NewsItem still persists via the outer pipeline.
        try {
          const extraction = await extractExamFromNews({
            title: articleTitle,
            url: articleUrl,
            publishedAt: new Date(),
          });
          if (!extraction) {
            console.log(`[NewsAction] exams: extraction returned null for "${articleTitle.slice(0, 60)}"`);
            break;
          }
          const result = await syncExamFromNews(
            extraction,
            { title: articleTitle, url: articleUrl, publishedAt: new Date() },
            districtId
          );
          console.log(
            `[NewsAction] ✅ Exam sync: ${extraction.shortName} → ` +
            `created ${result.created}, updated ${result.updated}, skipped ${result.skipped} ` +
            `across ${result.affectedDistricts} districts (scope=${extraction.scope})`
          );
        } catch (err) {
          console.error(
            "[NewsAction] exam sync failed:",
            err instanceof Error ? err.message : err
          );
        }
        break;
      }

      case "staffing": {
        const data = extractedData as Record<string, unknown>;
        if (
          data.module &&
          data.department &&
          data.roleName &&
          typeof data.sanctionedPosts === "number" &&
          typeof data.workingStrength === "number"
        ) {
          const vacantPosts = Math.max(0, (data.sanctionedPosts as number) - (data.workingStrength as number));
          const existing = await prisma.departmentStaffing.findFirst({
            where: {
              districtId,
              module: data.module as string,
              department: data.department as string,
              roleName: data.roleName as string,
            },
          });
          if (existing) {
            await prisma.departmentStaffing.update({
              where: { id: existing.id },
              data: {
                sanctionedPosts: data.sanctionedPosts as number,
                workingStrength: data.workingStrength as number,
                vacantPosts,
                asOfDate: new Date(),
                sourceUrl: articleUrl,
              },
            });
            console.log(`[NewsAction] ✅ Updated DepartmentStaffing: ${data.module}/${data.roleName}`);
          } else {
            await prisma.departmentStaffing.create({
              data: {
                districtId,
                module: data.module as string,
                department: data.department as string,
                roleName: data.roleName as string,
                sanctionedPosts: data.sanctionedPosts as number,
                workingStrength: data.workingStrength as number,
                vacantPosts,
                asOfDate: new Date(),
                sourceUrl: articleUrl,
              },
            });
            console.log(`[NewsAction] ✅ Created DepartmentStaffing: ${data.module}/${data.roleName}`);
          }
        }
        break;
      }

      default:
        console.log(`[NewsAction] No handler for ${targetModule}, skipping`);
    }
  } catch (err) {
    console.error(`[NewsAction] Error executing ${targetModule}:`, err);
  }
}
