const fileInput = document.getElementById("fileInput");
const cleanBtn = document.getElementById("cleanBtn");
const output = document.getElementById("output");

cleanBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
        output.innerText = "⚠️ No files selected.";
        return;
    }

    output.innerText = "";
    for (const file of files) {
        output.innerText += `Processing: ${file.name}\n`;
        try {
            if (file.type === "image/jpeg") {
                await cleanJPEG(file);
            } else if (file.type === "application/pdf") {
                await cleanPDF(file);
            } else {
                output.innerText += `⚠️ Unsupported file type: ${file.name}\n`;
            }
        } catch (err) {
            output.innerText += `❌ Error processing ${file.name}: ${err.message}\n`;
        }
    }
});

async function cleanJPEG(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

            // Create a new image to strip EXIF
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((cleanBlob) => {
                    downloadFile(cleanBlob, file.name.replace(".jpg", "_clean.jpg"));
                    output.innerText += `✅ Cleaned JPEG: ${file.name}\n`;
                    resolve();
                }, "image/jpeg");
            };
            img.src = URL.createObjectURL(blob);
        };
        reader.readAsArrayBuffer(file);
    });
}

async function cleanPDF(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        const arrayBuffer = e.target.result;
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
        pdfDoc.setCreationDate(undefined);
        pdfDoc.setModificationDate(undefined);

        const pdfBytes = await pdfDoc.save();
        downloadFile(new Blob([pdfBytes], { type: "application/pdf" }), file.name.replace(".pdf", "_clean.pdf"));
        output.innerText += `✅ Cleaned PDF: ${file.name}\n`;
    };
    reader.readAsArrayBuffer(file);
}

function downloadFile(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
