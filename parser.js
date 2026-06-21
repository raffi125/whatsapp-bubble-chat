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

    const pattern = /^(\d{2}\/\d{2}\/\d{2})\s(\d{2}\.\d{2})\s-\s([^:]+)(?::\s(.*))?$/;
    const parsed = line.match(pattern);

    if (parsed) {
        const date = parsed[1];
        const time = parsed[2];
        let sender = parsed[3];
        let message = parsed[4] || '';

        if (!parsed[4] && !sender.includes(':')) {
            return {
                type: 'system',
                date,
                text: replaceSystemTextWithAlias(sender, phoneAliases)
            };
        }

        let isEdited = false;
        if (message.includes('<Pesan ini diedit>')) {
            isEdited = true;
            message = message.replace('<Pesan ini diedit>', '').trim();
        }

        if (phoneAliases[sender]) {
            sender = phoneAliases[sender];
        }

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

    return {
        type: 'multiline',
        text: line
    };
}
