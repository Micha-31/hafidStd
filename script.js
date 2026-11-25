const $ = id => document.getElementById(id);
const emailValid = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);


const bukaModal = id => $(id).classList.add("tampil");
const tutupModal = id => $(id).classList.remove("tampil");

document.addEventListener("click", e => {
  const buka = e.target.closest("[data-buka]");
  if (buka) bukaModal(buka.dataset.buka);
  const tutup = e.target.matches(".modal") ? e.target
    : e.target.matches("[data-tutup]") ? e.target.closest(".modal") : null;
  if (tutup) tutup.classList.remove("tampil");
});


const penggunaAktif = () => JSON.parse(sessionStorage.getItem("sittaPengguna"));

function renderNavbar() {
  const nav = $("navbar");
  if (!nav) return;
  nav.innerHTML = `<ul>
    <li><a href="stok.html">Informasi Bahan Ajar</a></li>
    <li><a href="tracking.html">Tracking Pengiriman</a></li>
    <li class="dropdown"><a href="#" id="btnLaporan">Laporan ▾</a>
      <div class="dd-isi">
        <a href="tracking.html">Monitoring Progress DO Bahan Ajar</a>
        <a href="stok.html">Rekap Bahan Ajar</a>
      </div></li>
    <li><a href="#" id="btnHistori">Histori Transaksi Bahan Ajar</a></li>
    <li class="kanan"><a href="#" id="btnKeluar">Keluar</a></li>
  </ul>`;
  nav.querySelectorAll("a[href$='.html']").forEach(a => {
    if (location.pathname.endsWith(a.getAttribute("href"))) a.classList.add("aktif");
  });
  $("btnLaporan").onclick = e => { e.preventDefault(); e.target.parentElement.classList.toggle("buka"); };
  $("btnHistori").onclick = e => { e.preventDefault(); alert("Halaman Histori Transaksi belum tersedia."); };
  $("btnKeluar").onclick = e => { e.preventDefault(); sessionStorage.clear(); location.href = "index.html"; };
}

function sapaan() {
  const jam = new Date().getHours();
  return jam < 11 ? "pagi" : jam < 15 ? "siang" : jam < 18 ? "sore" : "malam";
}


function initLogin() {
  $("formLogin").addEventListener("submit", e => {
    e.preventDefault();
    const email = $("email").value.trim(), pass = $("password").value;
    if (!email || !pass) return alert("Email dan password wajib diisi.");
    const user = dataPengguna.find(u => u.email === email && u.password === pass);
    if (!user) return alert("email/password yang anda masukkan salah");
    sessionStorage.setItem("sittaPengguna",
      JSON.stringify({ nama: user.nama, role: user.role, lokasi: user.lokasi }));
    location.href = "dashboard.html";
  });

  $("formLupa").addEventListener("submit", e => {
    e.preventDefault();
    const email = $("emailLupa").value.trim();
    if (!emailValid(email)) return alert("Masukkan email yang valid.");
    alert("Tautan reset password dikirim ke " + email);
    e.target.reset(); tutupModal("modalLupa");
  });

  $("formDaftar").addEventListener("submit", e => {
    e.preventDefault();
    const nama = $("namaDaftar").value.trim(), email = $("emailDaftar").value.trim();
    const password = $("passDaftar").value, role = $("roleDaftar").value;
    const lokasi = $("lokasiDaftar").value.trim();
    if (!nama || !lokasi) return alert("Nama lengkap dan lokasi wajib diisi.");
    if (!emailValid(email)) return alert("Masukkan email yang valid.");
    if (password.length < 6) return alert("Password minimal 6 karakter.");
    if (dataPengguna.some(u => u.email === email)) return alert("Email sudah terdaftar.");
    dataPengguna.push({ id: dataPengguna.length + 1, nama, email, password, role, lokasi });
    alert("Pendaftaran berhasil. Silakan masuk.");
    e.target.reset(); tutupModal("modalDaftar");
  });
}


function initDashboard() {
  const p = penggunaAktif();
  $("profil").textContent = `${p.role} - ${p.lokasi}`;
  $("statJudul").textContent = dataBahanAjar.length;
  $("statStok").textContent = dataBahanAjar.reduce((total, b) => total + b.stok, 0);
  $("statDO").textContent = Object.keys(dataTracking).length;
}


function initTracking() {
  $("formCari").addEventListener("submit", e => {
    e.preventDefault();
    const no = $("noDO").value.trim(), hasil = $("hasil");
    hasil.innerHTML = "";
    if (!no) return alert("Nomor Delivery Order wajib diisi.");
    if (!dataTracking.hasOwnProperty(no)) return alert("Nomor DO " + no + " tidak ditemukan.");

    const d = dataTracking[no];
    
    const bahan = dataBahanAjar.find(b => b.kodeLokasi === d.paket);
    const paket = bahan ? `${d.paket} - ${bahan.namaBarang}` : d.paket;
    const kelas = { "Dalam Perjalanan": "status-perjalanan", "Dikirim": "status-dikirim" }[d.status] || "";
   
    const langkah = d.perjalanan.slice().reverse()
      .map(p => `<li><span>${p.keterangan}</span><time>${p.waktu}</time></li>`).join("");

    hasil.innerHTML = `
      <div class="kartu-biru"><div><h2>${d.nama}</h2><p>${no}</p></div><time>${d.tanggalKirim}</time></div>
      <p class="status ${kelas}">${d.status}</p>
      <dl class="detail">
        <dt>Ekspedisi</dt><dd>${d.ekspedisi}</dd>
        <dt>Tanggal Kirim</dt><dd>${d.tanggalKirim}</dd>
        <dt>Jenis Paket</dt><dd>${paket}</dd>
        <dt>Total Pembayaran</dt><dd>${d.total}</dd>
      </dl>
      <h3>Perjalanan Paket</h3>
      <ol class="timeline">${langkah}</ol>`;
  });
}


function barisStok(b) {
  const tr = document.createElement("tr");

  
  const tdCover = document.createElement("td");
  if (b.cover) {
    const img = document.createElement("img");
    img.src = b.cover;
    img.alt = "Cover " + b.namaBarang;
    img.className = "cover";
    img.onerror = () => { tdCover.textContent = "-"; };
    tdCover.appendChild(img);
  } else {
    tdCover.textContent = "-";
  }
  tr.appendChild(tdCover);

  [b.kodeLokasi, b.kodeBarang, b.namaBarang, b.jenisBarang, b.edisi, b.stok].forEach((v, i) => {
    const td = document.createElement("td");
    td.textContent = v;
    if (i === 5 && v < 100) td.className = "rendah";
    tr.appendChild(td);
  });
  $("tbodyStok").appendChild(tr);
}

function initStok() {
  dataBahanAjar.forEach(barisStok);
  $("formStok").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, pesan = $("pesan");
    const edisi = parseInt(f.edisi.value), stok = parseInt(f.stok.value);
    const b = {
      kodeLokasi: f.kodeLokasi.value.trim(), kodeBarang: f.kodeBarang.value.trim(),
      namaBarang: f.namaBarang.value.trim(), jenisBarang: f.jenisBarang.value.trim(),
      edisi: String(edisi), stok, cover: ""
    };
    if (!b.kodeLokasi || !b.kodeBarang || !b.namaBarang || !b.jenisBarang
        || Number.isNaN(edisi) || Number.isNaN(stok)) return pesan.textContent = "Semua kolom wajib diisi.";
    if (edisi < 1 || stok < 0) return pesan.textContent = "Edisi minimal 1 dan stok tidak boleh negatif.";
    if (dataBahanAjar.some(x => x.kodeBarang === b.kodeBarang)) return pesan.textContent = "Kode barang sudah ada.";
    dataBahanAjar.push(b);
    barisStok(b);
    pesan.textContent = " ";
    f.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const halaman = document.body.dataset.halaman;
  if (halaman !== "login" && !sessionStorage.getItem("sittaPengguna")) {
    location.replace("index.html");
    return;
  }
  renderNavbar();
  ({ login: initLogin, dashboard: initDashboard, tracking: initTracking, stok: initStok })[halaman]();
});
function waktuSekarang(){

  const d = new Date();
  let hour = d.getHours();

  if(hour >= 5 && hour <= 10 ){
    hour = "Selamat Pagi";
  }
  else if(hour >= 11 && hour <= 14 ){
    hour = "Selamat Siang";
  }
  else if(hour >= 15 && hour <= 18 ){
    hour = "Selamat Sore";
  }
  else{
    hour = "Selamat Malam";
  }
  document.getElementById("waktuSekarang").innerHTML = hour;
}
waktuSekarang();