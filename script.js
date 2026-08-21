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
template.src = "assets/certificate-template.png";
let currentWinner = null;

function setMessage(text, type="") {
  message.textContent = text;
  message.className = "message " + type;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const employeeCode = codeInput.value.trim();
  if (!employeeCode) return;
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    setMessage("The certificate portal is not connected to the database yet.", "error");
    return;
  }
  lookupBtn.disabled = true;
  setMessage("Checking your Employee Code…");
  panel.hidden = true;
  try {
    const url = APPS_SCRIPT_URL + "?employeeCode=" + encodeURIComponent(employeeCode);
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) {
      setMessage(data.message || "Certificate not found.", "error");
      return;
    }
    currentWinner = data;
    winnerName.textContent = data.name;
    winnerText.textContent = data.prize ? `Winner — ${data.prize}` : "Certificate of Achievement";
    await drawCertificate(data);
    panel.hidden = false;
    setMessage("Certificate found successfully.", "success");
  } catch (error) {
    console.error(error);
    setMessage("Unable to connect right now. Please try again.", "error");
  } finally {
    lookupBtn.disabled = false;
  }
});

function loadImage(image) {
  return new Promise((resolve, reject) => {
    if (image.complete && image.naturalWidth) return resolve(image);
    image.onload = () => resolve(image);
    image.onerror = reject;
  });
}

async function drawCertificate(data) {
  await loadImage(template);
  const ctx = canvas.getContext("2d");
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  ctx.drawImage(template, 0, 0);
  const x = canvas.width / 2;
  const y = 625;
  const maxWidth = canvas.width * 0.72;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#28469a";
  fitText(ctx, data.name, maxWidth, 58);
  ctx.fillText(data.name, x, y);
}

function fitText(ctx, text, maxWidth, fontSize) {
  let size = fontSize;
  while (size > 28) {
    ctx.font = `bold ${size}px Arial`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
}

downloadBtn.addEventListener("click", () => {
  if (!currentWinner) return;
  const { jsPDF } = window.jspdf;
  const safeName = currentWinner.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "Winner";
  const pdf = new jsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h, undefined, "FAST");
  pdf.save(`Financial_Azadi_Certificate_${safeName}.pdf`);
});