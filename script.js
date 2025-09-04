document.getElementById('cleanBtn').addEventListener('click', async () => {
    const files = document.getElementById('fileInput').files;
    if (!files.length) return alert('⚠️ Select at least one file!');

    const output = document.getElementById('output');
    output.innerHTML = '';

    logToConsole('🖥️ METAWIPE: Starting metadata cleaning process...');

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();

        let cleanBlob;

        if (file.type.startsWith('image/')) {
            cleanBlob = await cleanImageMetadata(arrayBuffer, file.type);
            logToConsole(`✅ Cleaned image: ${file.name}`);
        } else if (file.type === 'application/pdf') {
            cleanBlob = await cleanPDFMetadata(arrayBuffer);
            logToConsole(`✅ Processed PDF: ${file.name}`);
        } else {
            logToConsole(`⚠️ Skipped unsupported file: ${file.name}`);
            continue;
        }

        const url = URL.createObjectURL(cleanBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clean_${file.name}`;
        a.textContent = `⬇️ Download clean_${file.name}`;
        a.style.display = 'block';
        a.style.margin = '5px 0';
        output.appendChild(a);
    }

    logToConsole('💾 METAWIPE: All done!');
});

// ===== Image metadata cleaner =====
async function cleanImageMetadata(buffer, type) {
    return new Promise((resolve) => {
        const img = new Image();
        const blob = new Blob([buffer], { type });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((cleanBlob) => resolve(cleanBlob), type);
        };
        img.src = url;
    });
}

// ===== PDF metadata cleaner (basic) =====
async function cleanPDFMetadata(buffer) {
    // For now, just return same PDF (upgrade later with PDF-lib for full metadata removal)
    return new Blob([buffer], { type: 'application/pdf' });
}

// ===== Console-style logger =====
function logToConsole(msg) {
    const output = document.getElementById('output');
    const p = document.createElement('p');
    p.textContent = msg;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
}
