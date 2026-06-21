let mediaCache = {}; // Menyimpan Blob URL file media dari ZIP
let globalRawText = ""; // Menyimpan teks mentah untuk kebutuhan re-render

// Fungsi mengambil data alias dari UI Form ke dalam Objek {}
function getActiveAliases() {
    const aliases = {};
    const rows = document.querySelectorAll('.alias-row');
    rows.forEach(row => {
        const phone = row.querySelector('.input-phone').value.trim();
        const name = row.querySelector('.input-name').value.trim();
        if (phone && name) {
            aliases[phone] = name;
        }
    });
    return aliases;
}

// Handler tombol tambah baris input alias
document.getElementById('addAliasBtn').addEventListener('click', function() {
    const container = document.getElementById('aliasInputs');
    const newRow = document.createElement('div');
    newRow.className = 'alias-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Nomor HP" class="input-phone">
        <input type="text" placeholder="Nama Panggilan" class="input-name">
    `;
    container.appendChild(newRow);
});

// Handler tombol Terapkan Alias untuk re-render tanpa upload ulang
document.getElementById('applyAliasBtn').addEventListener('click', function() {
    if (globalRawText) {
        renderChatContainer(globalRawText);
    }
});

// Handler Upload File
document.getElementById('uploadFile').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '<div class="system-bubble">Sedang memproses file...</div>';
    
    mediaCache = {}; 
    globalRawText = ""; 

    if (file.name.endsWith('.zip')) {
        try {
            const zip = await JSZip.loadAsync(file);

            for (let filename in zip.files) {
                if (filename.endsWith('.txt') && !filename.startsWith('__MACOSX')) {
                    globalRawText = await zip.files[filename].async("text");
                } else if (!zip.files[filename].dir) {
                    const blob = await zip.files[filename].async("blob");
                    mediaCache[filename] = URL.createObjectURL(blob);
                }
            }

            if (globalRawText) {
                renderChatContainer(globalRawText);
            } else {
                chatArea.innerHTML = '<div class="system-bubble">File .txt tidak ditemukan di dalam ZIP.</div>';
            }
        } catch (err) {
            chatArea.innerHTML = '<div class="system-bubble">Gagal memproses file ZIP.</div>';
            console.error(err);
        }
    } else {
        const reader = new FileReader();
        reader.onload = function(e) {
            globalRawText = e.target.result;
            renderChatContainer(globalRawText);
        };
        reader.readAsText(file);
    }
});

function renderChatContainer(rawText) {
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = ''; 

    const lines = rawText.split('\n');
    let currentTrackingDate = null;
    
    // Ambil data alias dinamis yang diisi user di UI saat ini
    const activeAliases = getActiveAliases();

    lines.forEach(line => {
        const parsedData = parseChatLine(line, activeAliases);

        if (parsedData) {
            if (parsedData.date !== currentTrackingDate) {
                createDateDividerElement(parsedData.date);
                currentTrackingDate = parsedData.date;
            }

            if (parsedData.type === 'system') {
                createSystemMsgElement(parsedData.text);
            } else if (parsedData.type === 'chat') {
                buildChatBubbleElement(parsedData);
            }
        } else {
            appendLastMessageLine(line.trim());
        }
    });
}

// Fungsi pembantu pembuatan elemen DOM HTML (Date, System, Bubble)
function createDateDividerElement(dateLabel) {
    const area = document.getElementById('chatArea');
    const div = document.createElement('div');
    div.className = 'date-divider';
    div.innerText = dateLabel;
    area.appendChild(div);
}

// ... (Fungsi createSystemMsgElement, buildChatBubbleElement, appendLastMessageLine sama seperti script sebelumnya) ...
function createSystemMsgElement(text) {
    const area = document.getElementById('chatArea');
    const div = document.createElement('div');
    div.className = 'system-bubble';
    div.innerText = text;
    area.appendChild(div);
}

function buildChatBubbleElement(data) {
    const area = document.getElementById('chatArea');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${data.alignment}`;

    if (data.alignment === 'incoming') {
        const title = document.createElement('div');
        title.className = 'sender-title';
        title.innerText = data.sender;
        bubble.appendChild(title);
    }

    const msgContent = document.createElement('div');
    msgContent.className = 'message-content';

    const mediaRegex = /([\w-]+\.(?:jpg|jpeg|png|gif|webp|mp4|opus|ogg|mp3))/i;
    const hasMedia = data.message.match(mediaRegex);

    if (hasMedia && mediaCache[hasMedia[1]]) {
        const filename = hasMedia[1];
        const fileUrl = mediaCache[filename];

        if (filename.toLowerCase().endsWith('.mp4')) {
            const video = document.createElement('video');
            video.src = fileUrl;
            video.className = 'chat-media';
            video.controls = true;
            msgContent.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.className = 'chat-media';
            msgContent.appendChild(img);
        }
        
        let caption = data.message.replace(filename, '').replace('(file terlampir)', '').replace('<Media tidak disertakan>', '').trim();
        if (caption) {
            const capDiv = document.createElement('div');
            capDiv.style.marginTop = "5px";
            capDiv.innerText = caption;
            msgContent.appendChild(capDiv);
        }
    } else {
        msgContent.innerText = data.message;
    }
    
    bubble.appendChild(msgContent);

    const meta = document.createElement('div');
    meta.className = 'bubble-meta';
    meta.innerText = data.time;
    if (data.isEdited) {
        const editTag = document.createElement('span');
        editTag.className = 'tag-edited';
        editTag.innerText = '(diedit)';
        meta.prepend(editTag);
    }
    bubble.appendChild(meta);

    area.appendChild(bubble);
    area.scrollTop = area.scrollHeight;
}

function appendLastMessageLine(text) {
    const area = document.getElementById('chatArea');
    const lastMessage = area.querySelector('.chat-bubble:last-child .message-content');
    if (lastMessage) {
        if (lastMessage.querySelector('.chat-media')) {
            const txtDiv = document.createElement('div');
            txtDiv.innerText = text;
            lastMessage.appendChild(txtDiv);
        } else {
            lastMessage.innerText += `\n${text}`;
        }
    }
}
