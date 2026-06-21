// app.js - UI glue
const fileInput = document.getElementById('fileInput');
const chatContainer = document.getElementById('chatContainer');
const myNameInput = document.getElementById('myName');
const clearBtn = document.getElementById('clearBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');

let currentMessages = [];

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  handleText(text);
});

function handleText(text){
  const msgs = parseWhatsAppExport(text);
  currentMessages = msgs;
  renderMessages(msgs);
  downloadJsonBtn.disabled = false;
}

function renderMessages(messages){
  chatContainer.innerHTML = '';
  const myName = (myNameInput.value || '').trim().toLowerCase();

  messages.forEach(m => {
    if (!m.author){
      const el = document.createElement('div');
      el.className = 'system';
      el.textContent = m.text;
      chatContainer.appendChild(el);
      return;
    }

    const isMine = myName && (m.author.toLowerCase() === myName);
    const msgEl = document.createElement('div');
    msgEl.className = 'msg ' + (isMine ? 'right' : 'left');

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = (m.author || 'System') + (m.timestamp ? (' • ' + new Date(m.timestamp).toLocaleString()) : '');
    msgEl.appendChild(meta);

    const text = document.createElement('div');
    // preserve linebreaks
    text.innerHTML = m.text.replace(/\n/g, '<br/>');
    msgEl.appendChild(text);

    const ts = document.createElement('div');
    ts.className = 'timestamp';
    ts.textContent = m.date_raw || '';
    msgEl.appendChild(ts);

    chatContainer.appendChild(msgEl);
  });

  // scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

clearBtn.addEventListener('click', () => {
  chatContainer.innerHTML = '';
  fileInput.value = '';
  currentMessages = [];
  downloadJsonBtn.disabled = true;
});

downloadJsonBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(currentMessages, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whatsapp-chat.json';
  a.click();
  URL.revokeObjectURL(url);
});
