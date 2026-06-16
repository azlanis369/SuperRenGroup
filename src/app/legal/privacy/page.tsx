import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dasar Privasi" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Dasar Privasi</h1>
      <p>
        Super Ren Group ialah aplikasi dalaman untuk pengurusan listing hartanah.
        Kami menghormati privasi pengguna dan prospek.
      </p>
      <h2>Maklumat yang dikumpul</h2>
      <p>
        Kami mengumpul maklumat profil agent, butiran listing, serta maklumat lead
        dan deal yang dimasukkan oleh agent. Maklumat sensitif pembeli/penyewa dan
        butiran deal hanya boleh dilihat oleh agent pemilik dan admin.
      </p>
      <h2>Maklumat awam</h2>
      <p>
        Hanya listing dan profil yang ditetapkan sebagai &quot;awam&quot; akan
        dipaparkan kepada orang ramai. Alamat tepat hanya dipaparkan jika agent
        membenarkannya. Maklumat lead, deal dan pelanggan tidak pernah didedahkan
        pada halaman awam.
      </p>
      <h2>Penyimpanan data</h2>
      <p>
        Data disimpan dengan selamat menggunakan Supabase dengan Row Level
        Security. Akses dikawal mengikut peranan pengguna.
      </p>
      <h2>Hubungi</h2>
      <p>
        Untuk sebarang pertanyaan berkenaan privasi, sila hubungi admin kumpulan
        anda.
      </p>
    </>
  );
}
