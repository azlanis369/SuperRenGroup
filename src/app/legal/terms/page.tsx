import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terma & Penafian" };

export default function TermsPage() {
  return (
    <>
      <h1>Terma Penggunaan & Penafian</h1>
      <p>
        Dengan menggunakan Super Ren Group, anda bersetuju dengan terma berikut.
      </p>
      <h2>Penggunaan</h2>
      <p>
        Aplikasi ini adalah untuk kegunaan agent hartanah berdaftar di bawah
        kumpulan. Setiap agent bertanggungjawab terhadap ketepatan maklumat listing
        mereka.
      </p>
      <h2>Penafian listing</h2>
      <p>
        Maklumat listing dikongsi oleh agent dan tertakluk kepada perubahan tanpa
        notis. Sila sahkan butiran profesional, harga dan ketersediaan secara
        langsung dengan agent berkenaan sebelum membuat sebarang keputusan.
      </p>
      <h2>Data demo</h2>
      <p>
        Apabila Demo Mode aktif, sebahagian data adalah contoh/ujian sahaja dan
        tidak mewakili hartanah sebenar. Data sedemikian dilabel dengan jelas
        sebagai &quot;Demo&quot;.
      </p>
      <h2>Tanggungjawab</h2>
      <p>
        Kumpulan tidak bertanggungjawab terhadap sebarang kerugian akibat
        penggunaan maklumat dalam aplikasi ini.
      </p>
    </>
  );
}
