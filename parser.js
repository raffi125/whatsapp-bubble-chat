function replaceSystemTextWithAlias(systemText, phoneAliases) {
    let updatedText = systemText;
    for (const [phone, alias] of Object.entries(phoneAliases)) {
        if (phone.trim() && updatedText.includes(phone)) {
            updatedText = updatedText.replaceAll(phone, alias);
        }
    }
    return updatedText;
}

function parseChatLine(line, phoneAliases = {}) {
    line = line.trim();
    if (!line) return null;

    // Regex disesuaikan dengan format log kamu: "DD/MM/YY HH.MM - Pengirim: Pesan"
    const pattern = /^(\d{2}\/\d{2}\/\d{2})\s(\d{2}\.\d{2})\s-\s([^:]+)(?::\s(.*))?$/;
    const parsed = line.match(pattern);

    if (parsed) {
        const date = parsed[1];
        const time = parsed[2];
        let sender = parsed[3];
        let message = parsed[4] || '';

        // Jika tidak ada isi pesan setelah titik dua, anggap sebagai log sistem grup
        if (!parsed[4] && !sender.includes(':')) {
            return {
                type: 'system',
                date,
                text: replaceSystemTextWithAlias(sender, phoneAliases)
            };
        }

        // Cek apakah pesan pernah diedit
        let isEdited = false;
        if (message.includes('<Pesan ini diedit>')) {
            isEdited = true;
            message = message.replace('<Pesan ini diedit>', '').trim();
        }

        // Ubah nomor ke nama panggilan jika ada di daftar alias
        if (phoneAliases[sender]) {
            sender = phoneAliases[sender];
        }

        // Klasifikasi: Jika namanya mengandung 'anda' atau 'raffi' masuk ke kanan (outgoing)
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

    // Jika baris teks tidak cocok dengan format regex chat baru (berarti baris enter/multiline)
    return {
        type: 'multiline',
        text: line
    };
}
