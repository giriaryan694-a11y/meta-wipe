const fileInput = document.getElementById("fileInput");
const cleanBtn = document.getElementById("cleanBtn");
const output = document.getElementById("output");

function logMessage(msg) {
    const p = document.createElement("p");
    p.textContent = msg;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
}

async function cleanFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if(ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
        // JPEG/PNG EXIF metadata removal using piexifjs
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function() {
                let dataUrl = reader.result;
                try {
                    const stripped = piexif.remove(dataUrl);
                    const byteString = atob(stripped.split(',')[1]);
                    const ab = new Uint8Array(byteString.length);
                    for (let i = 0; i < byteString.length; i++) {
                        ab[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], {type: file.type});
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "cleaned_" + file.name;
                    link.click();
                    logMessage(`✅ Cleaned: ${file.name}`);
                } catch (e) {
                    logMessage(`⚠️ Failed to clean: ${file.name}`);
                }
            }
        } catch {
            logMessage(`⚠️ Error reading: ${file.name}`);
        }

    } else if(ext === 'pdf') {
        // PDF metadata removal using PDF-lib
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');
            pdfDoc.setCreationDate(null);
            pdfDoc.setModificationDate(null);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], {type: 'application/pdf'});
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "cleaned_" + file.name;
            link.click();
            logMessage(`✅ Cleaned: ${file.name}`);
        } catch {
            logMessage(`⚠️ Failed to clean: ${file.name}`);
        }

    } else {
        logMessage(`⚠️ Unsupported file type: ${file.name}`);
    }
}

cleanBtn.addEventListener("click", () => {
    output.innerHTML = '';
    const files = fileInput.files;
    if(files.length === 0){
        logMessage("⚠️ No files selected!");
        return;
    }
    for(let i=0; i<files.length; i++){
        cleanFile(files[i]);
    }
});
