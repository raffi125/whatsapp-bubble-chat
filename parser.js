// Fungsi untuk mengganti nomor HP di notifikasi sistem/grup berdasarkan input user
function replaceSystemTextWithAlias(systemText, phoneAliases) {
    let updatedText = systemText;
    for (const [phone, alias] of Object.entries(phoneAliases)) {
        if (phone.trim() && updatedText.includes(phone)) {
            updatedText = updatedText.replaceAll(phone, alias);
        }
    }
    return updatedText;
}

// Fungsi utama membedah baris teks chat dengan parameter aliases dinamis
function parseChatLine(line, phoneAliases = {}) {
    line = line.trim();
    if (!line) return null;

    // Regex standar ekspor WhatsApp: "DD/MM/YY HH.MM - Pengirim: Pesan"
    const pattern = /^(\d{2}\/\d{2}\/\d{2})\s(\d{2}\.\d{2})\s-\s([^:]+)(?::\s(.*))?$/;
    const parsed = line.match(pattern);

    if (parsed) {
        const date = parsed[1];
        const time = parsed[2];
        let sender = parsed[3];
        let message = parsed[4] || '';

        // Jika tidak ada pesan (:), anggap sebagai pesan sistem grup
        if (!parsed[4] && !sender.includes(':')) {
            return {
                type: 'system',
                date,
                text: replaceSystemTextWithAlias(sender, phoneAliases)
            };
        }

        // Cek indikator edit pesan
        let isEdited = false;
        if (message.includes('<Pesan ini diedit>')) {
            isEdited = true;
            message = message.replace('<Pesan ini diedit>', '').trim();
        }

        // Terapkan nama alias secara dinamis jika ada di objek inputan user
        if (phoneAliases[sender]) {
            sender = phoneAliases[sender];
        }

        // Klasifikasi posisi bubble (kanan jika Anda/Raffi)
        const isMyChat = (sender.toLowerCase() === 'anda' || sender.toLowerCase().includes('raffi'));
        
        return {
            type: 'chat',
            date,
            time,
            sender,
            message,
            alignment: isMyChat ? 'outgoing' : 'incoming',
            isEdited
        };
    }

    return null;
}
