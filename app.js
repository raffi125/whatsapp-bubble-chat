let mediaCache = {}; 
let globalRawText = ""; 
let lastSenderName = null;

const senderColors = {};
const colorPalette = ['#20a082', '#3571df', '#e56424', '#b32cc6', '#df3550', '#748b13', '#169ca4'];

function getSenderColor(name) {
    if (!senderColors[name]) {
        const randomIndex = Object.keys(senderColors).length % colorPalette.length;
        senderColors[name] = colorPalette[randomIndex];
    }
    return senderColors[name];
}

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

// Handler UI Tambah Row Alias
document.getElementById('addAliasBtn').addEventListener('click', function() {
    const container = document.getElementById('aliasInputs');
    const newRow = document.createElement('div');
    newRow.className = 'alias-row grid grid-cols-2 gap-2 bg-[#f0f2f5] p-2 rounded-lg border border-[#e9edef]';
    newRow.innerHTML = `
        <input type="text" placeholder="Nomor / Teks Asli" class="input-phone w-full bg-white text-xs rounded border border-[#e9edef] px-2 py-1.5 focus:outline-none focus:border-[#00a884]">
        <input type="text" placeholder="Nama Alias" class="input-name w-full bg-white text-xs rounded border border-[#e9edef] px-2 py-1.5 focus:outline-none focus:border-[#00a884]">
    `;
    container.appendChild(newRow);
});

// Handler Render Ulang Alias
document.getElementById('applyAliasBtn').addEventListener('click', function() {
    if (globalRawText) {
        renderChatContainer(globalRawText);
    }
});

// Handler File Upload (.zip / .txt)
document.getElementById('uploadFile').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '<div class="system-bubble">Sedang memproses file, mohon tunggu...</div>';
    
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
                chatArea.innerHTML = '<div class="system-bubble">Gagal menemukan file .txt di dalam ZIP.</div>';
            }
        } catch (err) {
            chatArea.innerHTML = '<div class="system-bubble">Gagal membuka berkas ZIP.</div>';
            console.error(err);
        }
    } else {
        const reader = new FileReader();
        reader.onload = function(e) {
            globalRawText = e.target.result;
            // CRITICAL FIX: Panggil fungsi render container, jangan gunakan chatArea.innerText = e.target.result!
            renderChatContainer(globalRawText);
        };
        reader.readAsText(file);
    }
});

function renderChatContainer(rawText) {
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = ''; // Kosongkan text mentah bawaan
    lastSenderName = null; 

    const lines = rawText.split('\n');
    let currentTrackingDate = null;
    const activeAliases = getActiveAliases();

    lines.forEach(line => {
        if (!line.trim()) return;
        const parsedData = parseChatLine(line, activeAliases);

        if (parsedData) {
            if (parsedData.type === 'system' || parsedData.type === 'chat') {
                if (parsedData.date !== currentTrackingDate) {
                    createDateDividerElement(parsedData.date);
                    currentTrackingDate = parsedData.date;
                    lastSenderName = null; 
                }

                if (parsedData.type === 'system') {
                    createSystemMsgElement(parsedData.text);
                    lastSenderName = null;
                } else if (parsedData.type === 'chat') {
                    buildChatBubbleElement(parsedData);
                }
            } else if (parsedData.type === 'multiline') {
                appendLastMessageLine(parsedData.text);
            }
        }
    });
}

function createDateDividerElement(dateLabel) {
    const area = document.getElementById('chatArea');
    const div = document.createElement('div');
    div.className = 'date-divider';
    div.innerText = dateLabel;
    area.appendChild(div);
}

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
    
    let tailClass = "";
    if (data.sender !== lastSenderName) {
        tailClass = data.alignment === 'outgoing' ? 'tail-out' : 'tail-in';
        lastSenderName = data.sender;
    }
    
    bubble.className = `chat-bubble ${data.alignment} ${tailClass}`;

    if (data.alignment === 'incoming' && tailClass !== "") {
        const title = document.createElement('div');
        title.className = 'sender-title';
        title.style.color = getSenderColor(data.sender);
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
            capDiv.style.marginTop = "4px";
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
        editTag.innerText = '(diedit) ';
        meta.prepend(editTag);
    }
    bubble.appendChild(meta);

    area.appendChild(bubble);
    area.scrollTop = area.scrollHeight;
}

function appendLastMessageLine(text) {
    const area = document.getElementById('chatArea');
    const lastBubble = area.querySelector('.chat-bubble:last-child .message-content');
    if (lastBubble) {
        if (lastBubble.querySelector('.chat-media')) {
            const txtDiv = document.createElement('div');
            txtDiv.innerText = text;
            lastBubble.appendChild(txtDiv);
        } else {
            lastBubble.innerText += `\n${text}`;
        }
    }
}
