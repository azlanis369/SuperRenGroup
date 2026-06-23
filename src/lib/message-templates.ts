// Rule-based message "autobot" — drafts stage-aware WhatsApp messages for the
// agent to send to a lead/customer, with a short guidance tip per stage.
// Each message is signed with the agent's mandatory stamp.

import { buildAgentStamp, type AgentStamp } from "@/lib/share";
import type { DealStatus, LeadStatus } from "@/lib/constants";

export type MsgCtx = {
  customerName?: string | null;
  listingTitle?: string | null;
  priceText?: string | null;
  agent?: AgentStamp;
};

export type Suggestion = { label: string; text: string };
export type MsgPack = { tip: string; items: Suggestion[] };

function hi(ctx: MsgCtx): string {
  return ctx.customerName ? `Hi ${ctx.customerName},` : "Hi,";
}
function re(ctx: MsgCtx): string {
  return ctx.listingTitle ? `"${ctx.listingTitle}"` : "hartanah ini";
}
function sign(body: string, ctx: MsgCtx): string {
  return body + buildAgentStamp(ctx.agent);
}
function s(label: string, body: string, ctx: MsgCtx): Suggestion {
  return { label, text: sign(body, ctx) };
}

// ---------------------------------------------------------------------------
// Deal pipeline messages
// ---------------------------------------------------------------------------
function dealPack(status: DealStatus, ctx: MsgCtx): MsgPack {
  const H = hi(ctx);
  const R = re(ctx);
  switch (status) {
    case "booked":
      return {
        tip: "Booking baru — kunci momentum. Sahkan langkah & dokumen dalam 24 jam.",
        items: [
          s("Sahkan booking + dokumen", `${H} Tahniah & terima kasih atas booking untuk ${R}. 🎉 Untuk teruskan, saya perlukan: (1) salinan IC, (2) bukti deposit. Boleh saya hantar borang sekarang?`, ctx),
          s("Ingatan deposit", `${H} Peringatan mesra untuk lengkapkan deposit booking ${R} supaya kita boleh teruskan ke peringkat seterusnya. Ada apa-apa saya boleh bantu?`, ctx),
        ],
      };
    case "pending":
      return {
        tip: "Dalam proses (loan/SPA). Beri update berkala supaya pelanggan tenang.",
        items: [
          s("Update status", `${H} Update untuk ${R}: urusan sedang dalam proses (loan/SPA). Saya akan maklumkan perkembangan dari semasa ke semasa. 👍`, ctx),
          s("Minta dokumen", `${H} Untuk mempercepatkan proses ${R}, boleh saya dapatkan dokumen berikut: slip gaji 3 bulan & penyata bank? Terima kasih!`, ctx),
        ],
      };
    case "closed":
      return {
        tip: "Deal selesai! Ucap tahniah & minta testimoni/rujukan mumpung gembira.",
        items: [
          s("Tahniah & terima kasih", `${H} Tahniah! 🎉 Urusan ${R} telah selesai dengan jayanya. Terima kasih atas kepercayaan anda — semoga selesa & berbahagia!`, ctx),
          s("Minta testimoni / rujukan", `${H} Gembira dapat bantu anda dengan ${R}. Jika berpuas hati, sudilah kongsi testimoni ringkas, atau rujuk rakan/keluarga yang sedang mencari hartanah. 🙏`, ctx),
        ],
      };
    case "cancelled":
      return {
        tip: "Deal terbatal — kekalkan hubungan baik & tawarkan pilihan lain.",
        items: [
          s("Tawar pilihan lain", `${H} Saya faham ${R} tak menjadi kali ini — tak mengapa. Saya ada beberapa pilihan lain yang mungkin lebih sesuai. Nak saya hantar?`, ctx),
        ],
      };
    case "refund":
      return {
        tip: "Urusan refund — beri kepastian & jangka masa yang jelas.",
        items: [
          s("Maklumat refund", `${H} Berkenaan ${R}, proses bayaran balik (refund) sedang diuruskan. Saya akan kemas kini status & jangka masa kepada anda. Maaf atas sebarang kesulitan.`, ctx),
        ],
      };
    default:
      return {
        tip: "Follow up mesra untuk kekalkan hubungan.",
        items: [
          s("Follow up am", `${H} Saya ingin follow up berkenaan ${R}. Ada apa-apa saya boleh bantu untuk langkah seterusnya? 😊`, ctx),
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Lead pipeline messages
// ---------------------------------------------------------------------------
function leadPack(status: LeadStatus, ctx: MsgCtx): MsgPack {
  const H = hi(ctx);
  const R = re(ctx);
  const who = ctx.agent?.name
    ? `Saya ${ctx.agent.name}${ctx.agent.agency ? ` dari ${ctx.agent.agency}` : ""}.`
    : "";
  switch (status) {
    case "new":
      return {
        tip: "Lead baru — hubungi dalam 24 jam pertama untuk peluang terbaik. ⏱️",
        items: [
          s("Perkenalan pertama", `${H} ${who} Terima kasih atas minat terhadap ${R}. Bila masa sesuai untuk saya kongsi butiran penuh atau atur viewing?`, ctx),
          s("Hantar butiran", `${H} ${who} Ini ringkasan ${R}${ctx.priceText ? ` — ${ctx.priceText}` : ""}. Saya boleh hantar gambar & detail penuh. Berminat untuk lihat?`, ctx),
        ],
      };
    case "contacted":
      return {
        tip: "Sudah dihubungi — dorong ke viewing untuk tingkatkan peluang tutup.",
        items: [
          s("Atur viewing", `${H} Nak saya aturkan viewing untuk ${R}? Hujung minggu ini ada slot pagi & petang. Yang mana sesuai untuk anda?`, ctx),
          s("Jawab soalan", `${H} Ada apa-apa soalan tentang ${R} yang boleh saya jelaskan? Saya sedia membantu. 😊`, ctx),
        ],
      };
    case "viewing":
      return {
        tip: "Peringkat viewing — sahkan temujanji & beri peringatan.",
        items: [
          s("Sahkan temujanji", `${H} Mengesahkan viewing untuk ${R}. Boleh confirm tarikh & masa yang sesuai? Saya akan uruskan selebihnya.`, ctx),
          s("Peringatan viewing", `${H} Peringatan mesra untuk viewing ${R} esok. Jumpa di lokasi ya — hubungi saya jika perlukan arah. 🙂`, ctx),
        ],
      };
    case "negotiating":
      return {
        tip: "Sedang rundingan — bantu atasi halangan & tawarkan terma terbaik.",
        items: [
          s("Dorong keputusan", `${H} Berkenaan ${R}, ada apa-apa yang menghalang keputusan anda? Saya boleh bantu rundingkan harga atau terma yang terbaik untuk anda.`, ctx),
          s("Tawaran istimewa", `${H} Saya telah bincang dengan pemilik untuk ${R} dan ada ruang untuk berunding. Nak saya kongsi tawaran terkini?`, ctx),
        ],
      };
    case "booked":
      return {
        tip: "Lead jadi booking! Sahkan langkah seterusnya segera.",
        items: [
          s("Sahkan booking", `${H} Tahniah atas booking ${R}! 🎉 Langkah seterusnya: dokumen & deposit. Boleh saya hantar senarai sekarang?`, ctx),
        ],
      };
    case "closed":
      return {
        tip: "Selesai — ucap tahniah & minta rujukan.",
        items: [
          s("Tahniah & rujukan", `${H} Tahniah & terima kasih atas urusan ${R}! 🎉 Jika ada rakan yang mencari hartanah, saya amat hargai rujukan anda. 🙏`, ctx),
        ],
      };
    case "lost":
      return {
        tip: "Lead sejuk — sapa semula secara mesra dengan tawaran baharu.",
        items: [
          s("Sapa semula", `${H} Sekadar menyapa 🙂 Jika anda masih mencari hartanah, saya ada beberapa listing baharu yang mungkin menarik. Nak saya hantar?`, ctx),
        ],
      };
    default:
      return {
        tip: "Follow up mesra.",
        items: [s("Follow up am", `${H} Saya ingin follow up berkenaan ${R}. Ada apa saya boleh bantu? 😊`, ctx)],
      };
  }
}

export function messagePack(
  kind: "deal" | "lead",
  status: string,
  ctx: MsgCtx,
): MsgPack {
  return kind === "deal"
    ? dealPack(status as DealStatus, ctx)
    : leadPack(status as LeadStatus, ctx);
}
