// Load daftar provinsi dari API
async function loadProvinces() {
    const provinceSelect = document.getElementById("province");
    provinceSelect.innerHTML = '<option value="">Pilih Provinsi</option>';

    try {
        const response = await fetch("https://ibnux.github.io/data-indonesia/provinsi.json");
        const provinces = await response.json();

        provinces.forEach(province => {
            const option = document.createElement("option");
            option.value = province.id;
            option.textContent = province.nama;
            provinceSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Gagal memuat provinsi:", error);
    }
}

// Load daftar kota berdasarkan provinsi dari API
async function loadCities() {
    const provinceId = document.getElementById("province").value;
    const citySelect = document.getElementById("city");
    citySelect.innerHTML = '<option value="">Pilih Kota</option>';

    if (!provinceId) return;

    try {
        const response = await fetch(`https://ibnux.github.io/data-indonesia/kota/${provinceId}.json`);
        const cities = await response.json();

        cities.forEach(city => {
            const option = document.createElement("option");
            option.value = city.nama;
            option.textContent = city.nama;
            citySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Gagal memuat kota:", error);
    }
}

// Ambil jadwal sholat dari API Aladhan dan Kemenag sebagai backup
async function getJadwal() {
    const cityName = document.getElementById("city").value;
    if (!cityName) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Silakan pilih kota terlebih dahulu!',
            confirmButtonColor: '#ff4757'
        });
        return;
    }

    try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${cityName}&country=Indonesia&method=5`);
        const data = await response.json();

        if (data.data && data.data.timings) {
            const jadwal = data.data.timings;

            document.querySelector("#jadwal-sholat tbody").innerHTML = `
                <tr><td>Imsak</td><td>${jadwal.Imsak}</td></tr>
                <tr><td>Subuh</td><td>${jadwal.Fajr}</td></tr>
                <tr><td>Dzuhur</td><td>${jadwal.Dhuhr}</td></tr>
                <tr><td>Ashar</td><td>${jadwal.Asr}</td></tr>
                <tr><td>Maghrib</td><td>${jadwal.Maghrib}</td></tr>
                <tr><td>Isya</td><td>${jadwal.Isha}</td></tr>
            `;
        } else {
            console.warn("Data tidak ditemukan di API Aladhan, mencoba API Kemenag...");
            getJadwalKemenag(cityName);
        }
    } catch (error) {
        console.error("Gagal mengambil data dari API Aladhan:", error);
        getJadwalKemenag(cityName);
    }
}

// API Kemenag sebagai alternatif jika API Aladhan kurang akurat
async function getJadwalKemenag(cityName) {
    try {
        // Dapatkan ID Kota dari API Kemenag
        const cityResponse = await fetch("https://bimasislam.kemenag.go.id/apiv1/getShalatDaerah");
        const cities = await cityResponse.json();
        const city = cities.find(c => c.lokasi.toLowerCase() === cityName.toLowerCase());

        if (!city) {
            alert("Kota tidak ditemukan dalam database Kemenag.");
            return;
        }

        const cityId = city.id;
        const today = new Date();
        const tahun = today.getFullYear();
        const bulan = String(today.getMonth() + 1).padStart(2, "0");
        const tanggal = String(today.getDate()).padStart(2, "0");

        // Ambil jadwal dari API Kemenag
        const response = await fetch(`https://bimasislam.kemenag.go.id/apiv1/getShalatJadwal/${cityId}/${tahun}/${bulan}/${tanggal}`);
        const data = await response.json();

        if (data.jadwal) {
            const jadwal = data.jadwal;

            // Debugging: cek waktu Isya
            console.log("Waktu Isya dari API Kemenag:", jadwal.isya);

            document.querySelector("#jadwal-sholat tbody").innerHTML = `
                <tr><td>Imsak</td><td>${jadwal.imsak}</td></tr>
                <tr><td>Subuh</td><td>${jadwal.subuh}</td></tr>
                <tr><td>Dzuhur</td><td>${jadwal.dzuhur}</td></tr>
                <tr><td>Ashar</td><td>${jadwal.ashar}</td></tr>
                <tr><td>Maghrib</td><td>${jadwal.maghrib}</td></tr>
                <tr><td>Isya</td><td>${jadwal.isya}</td></tr>
            `;
        } else {
            alert("Jadwal sholat tidak ditemukan dalam API Kemenag.");
        }
    } catch (error) {
        console.error("Terjadi kesalahan pada API Kemenag:", error);
        alert("Gagal mengambil data jadwal sholat.");
    }
}

// Tampilkan tanggal Masehi & Hijriyah
async function tampilkanTanggal() {
    const today = new Date();
    document.getElementById("tanggal-masehi").innerText = `📅 ${today.toLocaleDateString("id-ID")}`;

    try {
        const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
        const data = await response.json();
        if (data.data && data.data.hijri) {
            document.getElementById("tanggal-hijriyah").innerText = `🕌 ${data.data.hijri.day} ${data.data.hijri.month.en} ${data.data.hijri.year} H`;
        }
    } catch (error) {
        console.error("Gagal mengambil data Hijriyah:", error);
    }
}

// Jam digital real-time
function tampilkanJam() {
    setInterval(() => {
        document.getElementById("jam-digital").innerText = `⏰ ${new Date().toLocaleTimeString("id-ID")}`;
    }, 1000);
}

// Panggil fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    loadProvinces();
    tampilkanTanggal();
    tampilkanJam();
});

function highlightUpdatedCells() {
    document.querySelectorAll("#jadwal-sholat td").forEach(td => {
        td.classList.add("updated");
        setTimeout(() => td.classList.remove("updated"), 1000);
    });
}
