const form = document.getElementById("lookupForm");
const codeInput = document.getElementById("employeeCode");
const lookupBtn = document.getElementById("lookupBtn");
const message = document.getElementById("message");
const panel = document.getElementById("certificatePanel");
const winnerName = document.getElementById("winnerName");
const winnerText = document.getElementById("winnerText");
const canvas = document.getElementById("certificateCanvas");
const downloadBtn = document.getElementById("downloadBtn");

const achievementTemplate = new Image();
achievementTemplate.src = "Asset/certificate-template.png";

const participationTemplate = new Image();
participationTemplate.src = "Asset/participation-template.png";

let currentPerson = null;


function setMessage(text, type = "") {
  message.textContent = text;
  message.className = "message " + type;
}


function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}


function findPerson(employeeCode) {

  const code = normalizeCode(employeeCode);

  return CERTIFICATE_DATA.find(
    person => normalizeCode(person.employeeCode) === code
  );
}


form.addEventListener("submit", async (event) => {

  event.preventDefault();

  const employeeCode = codeInput.value.trim();

  if (!employeeCode) {
    setMessage(
      "Please enter your Employee Code.",
      "error"
    );
    return;
  }

  lookupBtn.disabled = true;
  panel.hidden = true;

  setMessage(
    "Checking your Employee Code..."
  );

  try {

    const person = findPerson(employeeCode);

    if (!person) {

      setMessage(
        "No certificate was found for this Employee Code.",
        "error"
      );

      return;
    }

    currentPerson = person;

    winnerName.textContent = person.name;

    if (person.marks === 8) {

      winnerText.textContent =
        person.prize
          ? `Winner — ${person.prize}`
          : "Certificate of Achievement";

    } else {

      winnerText.textContent =
        "Certificate of Participation";

    }

    await drawCertificate(person);

    panel.hidden = false;

    setMessage(
      "Certificate found successfully.",
      "success"
    );

  } catch (error) {

    console.error(error);

    setMessage(
      "Unable to generate the certificate. Please try again.",
      "error"
    );

  } finally {

    lookupBtn.disabled = false;

  }

});


function loadImage(image) {

  return new Promise((resolve, reject) => {

    if (
      image.complete &&
      image.naturalWidth
    ) {

      resolve(image);
      return;

    }

    image.onload = () => resolve(image);

    image.onerror = () =>
      reject(
        new Error(
          "Certificate template could not be loaded."
        )
      );

  });

}


async function drawCertificate(person) {

  const isAchievement =
    Number(person.marks) === 8;

  const template =
    isAchievement
      ? achievementTemplate
      : participationTemplate;

  await loadImage(template);

  await document.fonts.load(
    "700 130px Montserrat"
  );

  const ctx =
    canvas.getContext("2d");

  canvas.width =
    template.naturalWidth;

  canvas.height =
    template.naturalHeight;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.drawImage(
    template,
    0,
    0
  );


  /*
    Both supplied certificate templates use
    the same 2000 x 1414 layout.

    Name:
    - Montserrat Bold
    - centered
    - comfortably above dotted divider
  */

  const centerX =
    canvas.width / 2;

  const nameY =
    735;

  const maxWidth =
    canvas.width * 0.78;

  const startingSize =
    130;

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    "#28469a";

  fitText(
    ctx,
    person.name,
    maxWidth,
    startingSize
  );

  ctx.fillText(
    person.name,
    centerX,
    nameY
  );

}


function fitText(
  ctx,
  text,
  maxWidth,
  startingSize
) {

  let size =
    startingSize;

  while (size > 60) {

    ctx.font =
      `700 ${size}px Montserrat`;

    if (
      ctx.measureText(text).width
      <= maxWidth
    ) {
      break;
    }

    size -= 2;

  }

}


downloadBtn.addEventListener(
  "click",
  () => {

    if (!currentPerson) {
      return;
    }

    const { jsPDF } =
      window.jspdf;

    const safeName =
      currentPerson.name
        .replace(
          /[^a-z0-9]+/gi,
          "_"
        )
        .replace(
          /^_|_$/g,
          ""
        ) || "Participant";

    const prefix =
      Number(currentPerson.marks) === 8
        ? "Achievement"
        : "Participation";

    const pdf =
      new jsPDF({
        orientation:"landscape",
        unit:"mm",
        format:"a4",
        compress:true
      });

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const scale =
      Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height
      );

    const width =
      canvas.width * scale;

    const height =
      canvas.height * scale;

    const x =
      (pageWidth - width) / 2;

    const y =
      (pageHeight - height) / 2;

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

    pdf.save(
      `Financial_Azadi_${prefix}_Certificate_${safeName}.pdf`
    );

  }
);
