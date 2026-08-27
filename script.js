const form = document.getElementById("lookupForm");
const codeInput = document.getElementById("employeeCode");
const lookupBtn = document.getElementById("lookupBtn");
const message = document.getElementById("message");
const panel = document.getElementById("certificatePanel");
const winnerName = document.getElementById("winnerName");
const winnerText = document.getElementById("winnerText");
const canvas = document.getElementById("certificateCanvas");
const downloadBtn = document.getElementById("downloadBtn");

const template = new Image();
template.src = "Asset/certificate-template.png";

let currentWinner = null;

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = "message " + type;
}

function loadImage(image) {
  return new Promise((resolve, reject) => {
    if (image.complete && image.naturalWidth) {
      resolve(image);
      return;
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Certificate template could not be loaded."));
  });
}

function findEmployee(employeeCode) {
  const code = String(employeeCode || "").trim().toUpperCase();
  return CERTIFICATE_LOOKUP[code] || null;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const employeeCode = codeInput.value.trim();

  if (!employeeCode) {
    setMessage("Please enter your Employee Code.", "error");
    return;
  }

  lookupBtn.disabled = true;
  panel.hidden = true;
  setMessage("Checking your Employee Code...");

  try {
    // Lookup is now completely local. No Google Apps Script request is needed.
    const data = findEmployee(employeeCode);

    if (!data) {
      setMessage("No certificate was found for this Employee Code.", "error");
      return;
    }

    currentWinner = data;

    winnerName.textContent = data.name;
    winnerText.textContent = data.prize
      ? `Winner — ${data.prize}`
      : "Certificate of Achievement";

    await drawCertificate(data);

    panel.hidden = false;
    setMessage("Certificate found successfully.", "success");
  } catch (error) {
    console.error(error);
    setMessage(error.message || "Unable to load your certificate.", "error");
  } finally {
    lookupBtn.disabled = false;
  }
});

async function drawCertificate(data) {
  await loadImage(template);

  // Wait for the actual Montserrat font before measuring the name.
  await document.fonts.load("700 130px Montserrat");

  const ctx = canvas.getContext("2d");

  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;

  ctx.drawImage(template, 0, 0);

  // Large, centered name positioned above the dotted divider.
  const centerX = canvas.width / 2;
  const nameY = 735;
  const maxWidth = canvas.width * 0.78;
  const startingSize = 130;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#28469a";

  fitText(ctx, data.name, maxWidth, startingSize);
  ctx.fillText(data.name, centerX, nameY);
}

function fitText(ctx, text, maxWidth, startingSize) {
  let size = startingSize;

  while (size > 60) {
    ctx.font = `700 ${size}px Montserrat`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    size -= 2;
  }
}

downloadBtn.addEventListener("click", () => {
  if (!currentWinner) return;

  const { jsPDF } = window.jspdf;

  const safeName = currentWinner.name
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "") || "Winner";

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const scale = Math.min(
    pageWidth / canvas.width,
    pageHeight / canvas.height
  );

  const width = canvas.width * scale;
  const height = canvas.height * scale;

  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    x,
    y,
    width,
    height,
    undefined,
    "FAST"
  );

  pdf.save(`Financial_Azadi_Certificate_${safeName}.pdf`);
});
