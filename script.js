// script.js
document.addEventListener("DOMContentLoaded", function () {
    const cleanBtn = document.getElementById("cleanBtn");
    const fileInput = document.getElementById("fileInput");
    const output = document.getElementById("output");

    cleanBtn.addEventListener("click", async () => {
        if (fileInput.files.length === 0) {
            output.innerText = "⚠️ No files selected!";
            return;
        }

        output.innerText = ""; // clear previous log

        const files = Array.from(fileInput.files);

        for (const file of files) {
            output.innerText += `Processing: ${file.name}\n`;

            try {
                const cleanedBlob = await cleanFile(file);
                const link = document.createElement("a");
                link.href = URL.createObjectURL(cleanedBlob);
                link.download = `cleaned_${file.name}`;
                link.innerText = `⬇️ Download ${file.name}`;
                output.appendChild(document.createElement("br"));
                output.appendChild(link);
                output.appendChild(document.createElement("br"));
            } catch (err) {
                output.innerText += `❌ Failed to clean ${file.name}: ${err}\n`;
            }
        }
    });

    async function cleanFile(file) {
        const fileExt = file.name.split('.').pop().toLowerCase();

        if (["jpg", "jpeg", "png"].includes(fileExt)) {
            return await stripImageMetadata(file);
        } else if (fileExt === "pdf") {
            return await stripPDFMetadata(file);
        } else {
            throw `Unsupported file type: ${file.name}`;
        }
    }

    async function stripImageMetadata(file) {
        // Convert image to canvas and export as new blob
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(blob => resolve(blob), file.type);
                };
                img.onerror = () => reject("Image load error");
                img.src = e.target.result;
            };
            reader.onerror = () => reject("File read error");
            reader.readAsDataURL(file);
        });
    }

    async function stripPDFMetadata(file) {
        const { PDFDocument } = PDFLib; // make sure pdf-lib is included
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Remove all metadata
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
        pdfDoc.setCreationDate(undefined);
        pdfDoc.setModificationDate(undefined);

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: "application/pdf" });
    }
});
