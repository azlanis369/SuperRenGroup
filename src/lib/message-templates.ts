// Rule-based message "autobot" — drafts stage-aware WhatsApp messages for the
// agent to send to a lead/customer, with a short guidance tip per stage.
// Bilingual (BM/EN, follows the UI language). Each message is signed with the
// agent's mandatory stamp.

import { buildAgentStamp, type AgentStamp } from "@/lib/share";
import type { DealStatus, LeadStatus } from "@/lib/constants";
import type { Lang } from "@/lib/i18n/translations";

export type MsgCtx = {
  customerName?: string | null;
  listingTitle?: string | null;
  priceText?: string | null;
  agent?: AgentStamp;
};

export type Suggestion = { label: string; text: string };
export type MsgPack = { tip: string; items: Suggestion[] };

export type Tone = "mesra" | "formal" | "ringkas" | "lembut" | "urgent";

const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;

/** Re-tone a message body (greeting/wording), preserving the agent stamp. */
function applyTone(body: string, tone: Tone, lang: Lang): string {
  const en = lang === "en";
  switch (tone) {
    case "formal":
      return body
        .replace(/^Hi\b/, en ? "Dear" : "Salam sejahtera,")
        .replace(EMOJI, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/ +([.,!?])/g, "$1")
        .trim();
    case "ringkas": {
      const clean = body.replace(EMOJI, "").replace(/[ \t]{2,}/g, " ").trim();
      const sentences = clean.match(/[^.!?]+[.!?]+/g);
      // Keep greeting + the first substantive sentence.
      return sentences ? sentences.slice(0, 2).join(" ").trim() : clean;
    }
    case "lembut":
      return (en ? "Sorry to bother you 🙏 " : "Mohon maaf mengganggu 🙏 ") + body;
    case "urgent":
      return (
        body +
        (en
          ? "\n\n⏰ Kindly respond as soon as possible. Thank you!"
          : "\n\n⏰ Mohon maklum balas secepat mungkin. Terima kasih!")
      );
    default:
      return body;
  }
}

/** Apply a tone to every suggestion in a pack without touching the stamp. */
function tonePack(pack: MsgPack, ctx: MsgCtx, tone: Tone, lang: Lang): MsgPack {
  if (tone === "mesra") return pack;
  const stamp = buildAgentStamp(ctx.agent);
  return {
    ...pack,
    items: pack.items.map((it) => {
      const body =
        stamp && it.text.endsWith(stamp)
          ? it.text.slice(0, it.text.length - stamp.length)
          : it.text;
      return { ...it, text: applyTone(body, tone, lang) + stamp };
    }),
  };
}

function hi(ctx: MsgCtx): string {
  return ctx.customerName ? `Hi ${ctx.customerName},` : "Hi,";
}
function re(ctx: MsgCtx, lang: Lang): string {
  return ctx.listingTitle
    ? `"${ctx.listingTitle}"`
    : lang === "en"
      ? "this property"
      : "hartanah ini";
}
function s(label: string, body: string, ctx: MsgCtx): Suggestion {
  return { label, text: body + buildAgentStamp(ctx.agent) };
}

// ---------------------------------------------------------------------------
// Deal pipeline messages
// ---------------------------------------------------------------------------
function dealPack(status: DealStatus, ctx: MsgCtx, lang: Lang): MsgPack {
  const H = hi(ctx);
  const R = re(ctx, lang);
  const en = lang === "en";
  switch (status) {
    case "booked":
      return {
        tip: en
          ? "New booking — keep momentum. Confirm next steps & documents within 24 hours."
          : "Booking baru — kunci momentum. Sahkan langkah & dokumen dalam 24 jam.",
        items: [
          s(
            en ? "Confirm booking + documents" : "Sahkan booking + dokumen",
            en
              ? `${H} Congratulations & thank you for booking ${R}. 🎉 To proceed I'll need: (1) a copy of your IC, (2) proof of deposit. May I send the form now?`
              : `${H} Tahniah & terima kasih atas booking untuk ${R}. 🎉 Untuk teruskan, saya perlukan: (1) salinan IC, (2) bukti deposit. Boleh saya hantar borang sekarang?`,
            ctx,
          ),
          s(
            en ? "Deposit reminder" : "Ingatan deposit",
            en
              ? `${H} A friendly reminder to complete the booking deposit for ${R} so we can move to the next stage. Anything I can help with?`
              : `${H} Peringatan mesra untuk lengkapkan deposit booking ${R} supaya kita boleh teruskan ke peringkat seterusnya. Ada apa-apa saya boleh bantu?`,
            ctx,
          ),
        ],
      };
    case "pending":
      return {
        tip: en
          ? "In progress (loan/SPA). Give regular updates to keep the client at ease."
          : "Dalam proses (loan/SPA). Beri update berkala supaya pelanggan tenang.",
        items: [
          s(
            en ? "Status update" : "Update status",
            en
              ? `${H} Update on ${R}: the matter is in progress (loan/SPA). I'll keep you posted on developments. 👍`
              : `${H} Update untuk ${R}: urusan sedang dalam proses (loan/SPA). Saya akan maklumkan perkembangan dari semasa ke semasa. 👍`,
            ctx,
          ),
          s(
            en ? "Request documents" : "Minta dokumen",
            en
              ? `${H} To speed up the process for ${R}, may I get these documents: 3 months' payslips & bank statements? Thank you!`
              : `${H} Untuk mempercepatkan proses ${R}, boleh saya dapatkan dokumen berikut: slip gaji 3 bulan & penyata bank? Terima kasih!`,
            ctx,
          ),
        ],
      };
    case "closed":
      return {
        tip: en
          ? "Deal done! Congratulate & ask for a testimonial/referral while they're happy."
          : "Deal selesai! Ucap tahniah & minta testimoni/rujukan mumpung gembira.",
        items: [
          s(
            en ? "Congrats & thank you" : "Tahniah & terima kasih",
            en
              ? `${H} Congratulations! 🎉 The deal for ${R} is successfully completed. Thank you for your trust — wishing you all the best!`
              : `${H} Tahniah! 🎉 Urusan ${R} telah selesai dengan jayanya. Terima kasih atas kepercayaan anda — semoga selesa & berbahagia!`,
            ctx,
          ),
          s(
            en ? "Ask for testimonial / referral" : "Minta testimoni / rujukan",
            en
              ? `${H} It was a pleasure helping you with ${R}. If you're happy, a short testimonial — or a referral to friends/family looking for property — would mean a lot. 🙏`
              : `${H} Gembira dapat bantu anda dengan ${R}. Jika berpuas hati, sudilah kongsi testimoni ringkas, atau rujuk rakan/keluarga yang sedang mencari hartanah. 🙏`,
            ctx,
          ),
        ],
      };
    case "cancelled":
      return {
        tip: en
          ? "Deal cancelled — keep the relationship warm & offer alternatives."
          : "Deal terbatal — kekalkan hubungan baik & tawarkan pilihan lain.",
        items: [
          s(
            en ? "Offer alternatives" : "Tawar pilihan lain",
            en
              ? `${H} I understand ${R} didn't work out this time — no worries. I have a few other options that might suit better. Shall I send them?`
              : `${H} Saya faham ${R} tak menjadi kali ini — tak mengapa. Saya ada beberapa pilihan lain yang mungkin lebih sesuai. Nak saya hantar?`,
            ctx,
          ),
        ],
      };
    case "refund":
      return {
        tip: en
          ? "Refund case — give clarity & a clear timeline."
          : "Urusan refund — beri kepastian & jangka masa yang jelas.",
        items: [
          s(
            en ? "Refund info" : "Maklumat refund",
            en
              ? `${H} Regarding ${R}, the refund is being processed. I'll update you on the status & timeline. Sorry for any inconvenience.`
              : `${H} Berkenaan ${R}, proses bayaran balik (refund) sedang diuruskan. Saya akan kemas kini status & jangka masa kepada anda. Maaf atas sebarang kesulitan.`,
            ctx,
          ),
        ],
      };
    default:
      return {
        tip: en ? "Friendly follow-up to keep in touch." : "Follow up mesra untuk kekalkan hubungan.",
        items: [
          s(
            en ? "General follow-up" : "Follow up am",
            en
              ? `${H} Just following up regarding ${R}. Anything I can help with for the next steps? 😊`
              : `${H} Saya ingin follow up berkenaan ${R}. Ada apa-apa saya boleh bantu untuk langkah seterusnya? 😊`,
            ctx,
          ),
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Lead pipeline messages
// ---------------------------------------------------------------------------
function leadPack(status: LeadStatus, ctx: MsgCtx, lang: Lang): MsgPack {
  const H = hi(ctx);
  const R = re(ctx, lang);
  const en = lang === "en";
  const who = ctx.agent?.name
    ? en
      ? ` I'm ${ctx.agent.name}${ctx.agent.agency ? ` from ${ctx.agent.agency}` : ""}.`
      : ` Saya ${ctx.agent.name}${ctx.agent.agency ? ` dari ${ctx.agent.agency}` : ""}.`
    : "";
  switch (status) {
    case "new":
      return {
        tip: en
          ? "New lead — contact within the first 24 hours for the best chance. ⏱️"
          : "Lead baru — hubungi dalam 24 jam pertama untuk peluang terbaik. ⏱️",
        items: [
          s(
            en ? "First introduction" : "Perkenalan pertama",
            en
              ? `${H}${who} Thank you for your interest in ${R}. When's a good time for me to share full details or arrange a viewing?`
              : `${H}${who} Terima kasih atas minat terhadap ${R}. Bila masa sesuai untuk saya kongsi butiran penuh atau atur viewing?`,
            ctx,
          ),
          s(
            en ? "Send details" : "Hantar butiran",
            en
              ? `${H}${who} Here's a summary of ${R}${ctx.priceText ? ` — ${ctx.priceText}` : ""}. I can send photos & full details. Interested to see?`
              : `${H}${who} Ini ringkasan ${R}${ctx.priceText ? ` — ${ctx.priceText}` : ""}. Saya boleh hantar gambar & detail penuh. Berminat untuk lihat?`,
            ctx,
          ),
        ],
      };
    case "contacted":
      return {
        tip: en
          ? "Already contacted — push toward a viewing to raise close rate."
          : "Sudah dihubungi — dorong ke viewing untuk tingkatkan peluang tutup.",
        items: [
          s(
            en ? "Arrange viewing" : "Atur viewing",
            en
              ? `${H} Shall I arrange a viewing for ${R}? This weekend has morning & afternoon slots. Which suits you?`
              : `${H} Nak saya aturkan viewing untuk ${R}? Hujung minggu ini ada slot pagi & petang. Yang mana sesuai untuk anda?`,
            ctx,
          ),
          s(
            en ? "Answer questions" : "Jawab soalan",
            en
              ? `${H} Any questions about ${R} I can help clarify? Happy to assist. 😊`
              : `${H} Ada apa-apa soalan tentang ${R} yang boleh saya jelaskan? Saya sedia membantu. 😊`,
            ctx,
          ),
        ],
      };
    case "viewing":
      return {
        tip: en
          ? "Viewing stage — confirm the appointment & send a reminder."
          : "Peringkat viewing — sahkan temujanji & beri peringatan.",
        items: [
          s(
            en ? "Confirm appointment" : "Sahkan temujanji",
            en
              ? `${H} Confirming the viewing for ${R}. Could you confirm a suitable date & time? I'll handle the rest.`
              : `${H} Mengesahkan viewing untuk ${R}. Boleh confirm tarikh & masa yang sesuai? Saya akan uruskan selebihnya.`,
            ctx,
          ),
          s(
            en ? "Viewing reminder" : "Peringatan viewing",
            en
              ? `${H} A friendly reminder for the ${R} viewing tomorrow. See you there — call me if you need directions. 🙂`
              : `${H} Peringatan mesra untuk viewing ${R} esok. Jumpa di lokasi ya — hubungi saya jika perlukan arah. 🙂`,
            ctx,
          ),
        ],
      };
    case "negotiating":
      return {
        tip: en
          ? "Negotiating — help remove blockers & offer the best terms."
          : "Sedang rundingan — bantu atasi halangan & tawarkan terma terbaik.",
        items: [
          s(
            en ? "Nudge decision" : "Dorong keputusan",
            en
              ? `${H} Regarding ${R}, is anything holding back your decision? I can help negotiate the best price or terms for you.`
              : `${H} Berkenaan ${R}, ada apa-apa yang menghalang keputusan anda? Saya boleh bantu rundingkan harga atau terma yang terbaik untuk anda.`,
            ctx,
          ),
          s(
            en ? "Special offer" : "Tawaran istimewa",
            en
              ? `${H} I've spoken with the owner about ${R} and there's room to negotiate. Want me to share the latest offer?`
              : `${H} Saya telah bincang dengan pemilik untuk ${R} dan ada ruang untuk berunding. Nak saya kongsi tawaran terkini?`,
            ctx,
          ),
        ],
      };
    case "booked":
      return {
        tip: en ? "Lead became a booking! Confirm next steps quickly." : "Lead jadi booking! Sahkan langkah seterusnya segera.",
        items: [
          s(
            en ? "Confirm booking" : "Sahkan booking",
            en
              ? `${H} Congrats on booking ${R}! 🎉 Next steps: documents & deposit. May I send the list now?`
              : `${H} Tahniah atas booking ${R}! 🎉 Langkah seterusnya: dokumen & deposit. Boleh saya hantar senarai sekarang?`,
            ctx,
          ),
        ],
      };
    case "closed":
      return {
        tip: en ? "Done — congratulate & ask for a referral." : "Selesai — ucap tahniah & minta rujukan.",
        items: [
          s(
            en ? "Congrats & referral" : "Tahniah & rujukan",
            en
              ? `${H} Congratulations & thank you for the ${R} deal! 🎉 If anyone you know is looking for property, I'd really appreciate your referral. 🙏`
              : `${H} Tahniah & terima kasih atas urusan ${R}! 🎉 Jika ada rakan yang mencari hartanah, saya amat hargai rujukan anda. 🙏`,
            ctx,
          ),
        ],
      };
    case "lost":
      return {
        tip: en ? "Cold lead — reconnect warmly with a fresh offer." : "Lead sejuk — sapa semula secara mesra dengan tawaran baharu.",
        items: [
          s(
            en ? "Reconnect" : "Sapa semula",
            en
              ? `${H} Just checking in 🙂 If you're still looking for property, I have a few new listings that might interest you. Shall I send them?`
              : `${H} Sekadar menyapa 🙂 Jika anda masih mencari hartanah, saya ada beberapa listing baharu yang mungkin menarik. Nak saya hantar?`,
            ctx,
          ),
        ],
      };
    default:
      return {
        tip: en ? "Friendly follow-up." : "Follow up mesra.",
        items: [
          s(
            en ? "General follow-up" : "Follow up am",
            en ? `${H} Just following up regarding ${R}. How can I help? 😊` : `${H} Saya ingin follow up berkenaan ${R}. Ada apa saya boleh bantu? 😊`,
            ctx,
          ),
        ],
      };
  }
}

export function messagePack(
  kind: "deal" | "lead",
  status: string,
  ctx: MsgCtx,
  lang: Lang = "ms",
  tone: Tone = "mesra",
): MsgPack {
  const pack =
    kind === "deal"
      ? dealPack(status as DealStatus, ctx, lang)
      : leadPack(status as LeadStatus, ctx, lang);
  return tonePack(pack, ctx, tone, lang);
}
