const express = require('express');
const mongoose = require('mongoose');

//koneksi ke MongoDB
mongoose.connect('mongodb://localhost:27017/moneyTracker')
  .then(() => {
      console.log('Terhubung ke database MongoDB');
  })
  .catch((error) => {
      console.error('Gagal terhubung ke database:', error);
  });

const aplikasi = express();
//const PORT = 3000;

aplikasi.use(express.json());

// aplikasi.listen(PORT, () => {
//     console.log(`Server berjalan di http://localhost:${PORT}`);
// });

//model data pengeluaran
const PengeluaranSchema = new mongoose.Schema({
    deskripsi: {type: String, required: true},
    jumlah: {type: Number, required: true},
    tanggal: {type: Date, required: true},
    kategori: {type: String, required: true}
});
const Pengeluaran = mongoose.model('Pengeluaran', PengeluaranSchema);

//data dummy
// let pengeluaran = [
//     {
//         id: 1,
//         deskripsi: 'Belanja bulanan',
//         jumlah: 100000,
//         tanggal: '2024-10-20',
//         kategori: 'Makanan'
//     }
// ];

aplikasi.post('/pengeluaran', async (req, res) => {
    try {
        const pengeluaranData = req.body; //array dari pengeluaran
        const pengeluaranBaru = await Pengeluaran.insertMany(pengeluaranData); // menggunakan insertMany untuk menyimpan beberapa data
        res.status(201).json(pengeluaranBaru);
    } catch (error) {
        console.error(error); //untuk melihat error di terminal
        res.status(500).json({ pesan: 'Gagal menambahkan pengeluaran' });
    }
});

aplikasi.get('/pengeluaran', async (req, res) => {
    try {
        const dataPengeluaran = await Pengeluaran.find();
        res.json(dataPengeluaran);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil data pengeluaran' });
    }
});

aplikasi.get('/pengeluaran/:id', async (req, res) => {
    try {
        const dataPengeluaran = await Pengeluaran.findById(req.params.id);
        if (dataPengeluaran) {
            res.json(dataPengeluaran);
        } else {
            res.status(404).json({ pesan: 'Pengeluaran tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil data pengeluaran' });
    }
});

aplikasi.put('/pengeluaran/:id', async (req, res) => {
    try {
        const { deskripsi, jumlah, tanggal, kategori } = req.body;
        const dataPengeluaran = await Pengeluaran.findByIdAndUpdate(
            req.params.id,
            { deskripsi, jumlah, tanggal, kategori },
            { new: true }
        );
        if (dataPengeluaran) {
            res.json(dataPengeluaran);
        } else {
            res.status(404).json({ pesan: 'Pengeluaran tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal memperbarui data pengeluaran' });
    }
});

aplikasi.delete('/pengeluaran/:id', async (req, res) => {
    try {
        const dataPengeluaran = await Pengeluaran.findByIdAndDelete(req.params.id);
        if (dataPengeluaran) {
            res.json(dataPengeluaran);
        } else {
            res.status(404).json({ pesan: 'Pengeluaran tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal menghapus data pengeluaran' });
    }
});

//endpoint tambahan untuk filter pengeluaran berdasarkan katergori (menampilkan daftar pengeluaran)
aplikasi.get('/pengeluaran/kategori/:kategori', async (req, res) => {
    //mengambil daftar pengeluaran berdasarkan kategori
    try {
        const filterPengeluaran = await Pengeluaran.find({ kategori: req.params.kategori });
        res.json(filterPengeluaran);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil data pengeluaran' });
    }
});

//endpoint tambahan untuk menghitung total pengeluaran berdasarkan kategori
aplikasi.get('/pengeluaran/total/:kategori', async (req, res) => {
    try {
        const kategori = req.params.kategori;
        const total = await Pengeluaran.aggregate([
            { $match: { kategori } },
            { $group: { _id: null, total: { $sum: "$jumlah" } } }
        ]);
        res.json(total.length ? total[0].total : 0);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal menghitung total pengeluaran' });
    }
});

//endpoint tambahan untuk mengambil daftar pengeluaran berdasarkan tanggal tertentu
aplikasi.get('/pengeluaran/hari/:tanggal', async (req, res) => {
    try {
        const filterPengeluaran = await Pengeluaran.find({
            tanggal: {
                $gte: new Date(req.params.tanggal),
                $lt: new Date(new Date(req.params.tanggal).setDate(new Date(req.params.tanggal).getDate() + 1))
            }
        });
        res.json(filterPengeluaran);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil data pengeluaran' });
    }
});

//endpoint tambahan untuk mengambil daftar pengeluaran berdasarkan bulan dan tahun tertentu
aplikasi.get('/pengeluaran/bulanan/:tahun/:bulan', async (req, res) => {
    try {
        const filterPengeluaran = await Pengeluaran.find({
            tanggal: {
                $gte: new Date(req.params.tahun, req.params.bulan - 1, 1),
                $lt: new Date(req.params.tahun, req.params.bulan, 1)
            }
        });
        res.json(filterPengeluaran);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil data pengeluaran' });
    }
});

//endpoint tambahan untuk mengambil pengeluaran tertinggi
aplikasi.get('/pengeluaran/tertinggi', async (req, res) => {
    try {
        const pengeluaranTertinggi = await Pengeluaran.find().sort({ jumlah: -1 }).limit(1);
        res.json(pengeluaranTertinggi);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil pengeluaran tertinggi' });
    }
});

//endpoint tambahan untuk menghitung rata-rata pengeluaran berdasarkan kategori tertentu
aplikasi.get('/pengeluaran/rata-rata/:kategori', async (req, res) => {
    try {
        const kategori = req.params.kategori;
        const rataRata = await Pengeluaran.aggregate([
            { $match: { kategori } },
            { $group: { _id: null, average: { $avg: "$jumlah" } } }
        ]);
        res.json(rataRata.length ? rataRata[0].average : 0);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal menghitung rata-rata pengeluaran' });
    }
});

//endpoint tambahan untuk mengambil statistik total dan jumlah pengeluaran
aplikasi.get('/pengeluaran/statistik', async (req, res) => {
    try {
        const totalPengeluaran = await Pengeluaran.aggregate([
            { $group: { _id: null, total: { $sum: "$jumlah" } } }
        ]);
        const jumlahPengeluaran = await Pengeluaran.countDocuments();
        res.json({
            total: totalPengeluaran.length ? totalPengeluaran[0].total : 0,
            jumlah: jumlahPengeluaran
        });
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mendapatkan statistik pengeluaran' });
    }
});

const PORT = process.env.PORT || 3000;
aplikasi.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});