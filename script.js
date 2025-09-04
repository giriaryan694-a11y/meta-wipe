const fileInput = document.getElementById('fileInput');
const cleanBtn = document.getElementById('cleanBtn');
const output = document.getElementById('output');
const dropArea = document.getElementById('dropArea');
const exportLogBtn = document.getElementById('exportLogBtn');

let logData = [];

// Drag & Drop events
dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.style.borderColor = "#0f0";
});
dropArea.addEventListener('dragleave', e => {
    e.preventDefault();
    dropArea.style.borderColor = "#00ff00";
});
dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.style.borderColor = "#00ff00";
    handleFiles(e.dataTransfer.files);
});

// File input change
fileInput.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
    for (const file of files) {
        processFile(file);
    }
}

async function processFile(file) {
    const fileName = file.name;
    outputLog(`Processing: ${fileName}`);

    try {
        if (fileName.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            pdfDoc.setTitle("");
            pdfDoc.setAuthor("");
            pdfDoc.setSubject("");
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer("");
            pdfDoc.setCreator("");
            const cleanedBytes = await pdfDoc.save();
            downloadFile(cleanedBytes, fileName);
            outputLog(`✅ PDF metadata cleaned: ${fileName}`);
        } else if (fileName.endsWith('.docx')) {
            const jszip = new JSZip();
            const arrayBuffer = await file.arrayBuffer();
            const zip = await jszip.loadAsync(arrayBuffer);
            if (zip.file("docProps/core.xml")) {
                zip.file("docProps/core.xml", '');
            }
            const cleanedBlob = await zip.generateAsync({ type: "blob" });
            downloadFile(cleanedBlob, fileName);
            outputLog(`✅ DOCX metadata cleaned: ${fileName}`);
        } else if (fileName.endsWith('.mp3')) {
            // Basic MP3 metadata removal (ID3v1 & ID3v2)
            const arrayBuffer = await file.arrayBuffer();
            const cleanedBuffer = removeMP3Metadata(arrayBuffer);
            downloadFile(cleanedBuffer, fileName);
            outputLog(`✅ MP3 metadata cleaned: ${fileName}`);
        } else {
            outputLog(`⚠️ Unsupported file type: ${fileName}`);
        }
        logData.push(fileName);
    } catch (err) {
        outputLog(`❌ Error processing ${fileName}: ${err}`);
    }
}

function outputLog(message) {
    output.textContent += message + '\n';
    output.scrollTop = output.scrollHeight;
}

function downloadFile(data, fileName) {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

function removeMP3Metadata(arrayBuffer) {
    let bytes = new Uint8Array(arrayBuffer);
    // Remove ID3v2 tag at start
    if (bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) {
        const size = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | (bytes[9]);
        bytes = bytes.slice(size + 10);
    }
    // Remove ID3v1 tag at end
    if (bytes[bytes.length - 128] === 84 && bytes[bytes.length - 127] === 65 && bytes[bytes.length - 126] === 71) {
        bytes = bytes.slice(0, bytes.length - 128);
    }
    return new Blob([bytes], { type: 'audio/mp3' });
}

// Export log
exportLogBtn.addEventListener('click', () => {
    if (logData.length === 0) return alert('No processed files to export!');
    const blob = new Blob([logData.join('\n')], { type: 'text/plain' });
    downloadFile(blob, 'METAWIPE_Log.txt');
});
