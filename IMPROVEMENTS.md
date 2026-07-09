# Backend Improvements & Features (Part 1 & Part 2)

Dokumen ini menjelaskan secara rinci seluruh fitur dan peningkatan (improvements) yang telah dikembangkan di repositori backend ini dibandingkan dengan *state* kosong/sebelumnya.

## 1. Arsitektur & Infrastruktur Dasar
- **Azure Functions (TypeScript):** Menginisialisasi kerangka kerja serverless menggunakan arsitektur Node.js dan TypeScript untuk performa dan keamanan tipe data (*type safety*).
- **Koneksi Azure Cosmos DB (`database.ts`):** 
  - Mengimplementasikan *Singleton Pattern* untuk instance `CosmosClient` agar koneksi database efisien dan tidak membebani server saat terjadi *cold start*.
  - Mengonfigurasi pembacaan *connection string* secara dinamis dari `local.settings.json`.

## 2. Manajemen Error Terpusat (Centralized Error Handling)
- **`errorHandler.ts` (Middleware):** 
  - Membuat *Higher-Order Function* (HOF) untuk membungkus semua Azure Functions.
  - Secara otomatis menangkap error spesifik dari Cosmos DB (misal: `404 Not Found`, `409 Conflict`, `429 Too Many Requests`) dan menerjemahkannya menjadi respons HTTP yang rapi dan aman ke frontend.
  - Memvalidasi parsing JSON (`SyntaxError`) untuk mengembalikan `400 Bad Request` alih-alih membuat server *crash*.

## 3. Fitur Utama Manajemen Tugas (Task API - Part 1)
Mengimplementasikan operasi CRUD (Create, Read, Update, Delete) penuh untuk *Task Management*:
- **`GetTasks`:** Mengambil daftar tugas dengan dukungan fitur tingkat lanjut:
  - Pencarian (Search) berdasarkan judul/deskripsi.
  - Penyaringan (Filtering) berdasarkan *Status* atau *Priority*.
  - Paginasi data (Pagination) untuk efisiensi beban saat data sangat besar.
- **`CreateTask` & `UpdateTask`:** Membuat dan memperbarui tugas, dilengkapi dengan logika validasi tipe data (menggunakan `task.validator.ts`) sebelum data masuk ke database.
- **Dukungan `customFields`:** Mengubah skema Cosmos DB dan fungsi `UpdateTask` untuk dapat menyimpan payload dinamis berupa properti `customFields` di dalam JSON document Tugas, sebagai fondasi untuk fitur Form Builder.
- **`BulkDeleteTasks`:** Menambahkan fitur hapus massal (*bulk delete*) agar pengguna dapat menghapus banyak tugas sekaligus, meningkatkan efisiensi proses di sisi server dan UX.

## 4. Fitur Pengaturan Form Dinamis (Form Builder API - Part 2)
Mengembangkan infrastruktur backend untuk mendukung kustomisasi form (drag-and-drop di frontend):
- **Endpoint Pengaturan (`GetFormSettings` & `UpdateFormSettings`):**
  - Menyediakan rute API khusus `GET /api/settings/form` dan `PUT /api/settings/form` untuk mengambil dan memperbarui status form kustom per `organizationId`.
- **Cosmos DB Auto-Provisioning (`settings.service.ts`):**
  - Mengimplementasikan metode `createIfNotExists` pada fungsi internal. Saat pertama kali sistem atau *tenant* (organisasi) mencoba menyimpan atau mengambil *Settings*, backend akan secara otomatis membuat *Container* Cosmos DB untuk "Settings" jika belum tersedia. Ini menyelesaikan masalah `404 Not Found` pada *fresh deployment*.
- **Refaktor Skema Data yang Lebih Fleksibel:**
  - Mengganti model data `rows` (berbasis baris statis) menjadi array `fields` yang rata (*flat array*).
  - Menambahkan dukungan variabel `width` (lebar berbasis sistem *grid 12-kolom*) agar API mendukung tampilan UI form yang jauh lebih fleksibel tanpa terikat batasan maksimal kolom.

## 5. Perbaikan & Penyesuaian Lanjutan (Hotfixes)
- **Penanganan Zombie Process Port 7071:** Menyelesaikan masalah Azure Core Tools (`func.exe`) yang gagal melakukan *bind port* ketika terjadi proses asinkronus yang tidak tertutup sempurna saat *live reload*.
- **CORS Config:** Menyempurnakan konfigurasi `local.settings.json` dan `host.json` agar *Cross-Origin Resource Sharing* diizinkan secara spesifik pada port lokal frontend (Vite port 5173).
