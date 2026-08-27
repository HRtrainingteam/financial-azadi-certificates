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


/* -----------------------------
   MESSAGE
----------------------------- */

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = "message " + type;
}


/* -----------------------------
   JSONP LOOKUP
----------------------------- */

function lookupEmployeeCode(employeeCode) {

  return new Promise((resolve, reject) => {

    const callbackName =
      "certificateCallback_" + Date.now();

    const script = document.createElement("script");

    const timeout = setTimeout(() => {

      cleanup();

      reject(
        new Error(
          "The certificate server took too long to respond."
        )
      );

    }, 15000);


    function cleanup() {

      clearTimeout(timeout);

      if (window[callbackName]) {
        delete window[callbackName];
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }


    window[callbackName] = function(data) {

      cleanup();
      resolve(data);

    };


    script.onerror = function() {

      cleanup();

      reject(
        new Error(
          "Unable to connect to the certificate server."
        )
      );

    };


    const url =
      APPS_SCRIPT_URL +
      "?employeeCode=" +
      encodeURIComponent(employeeCode) +
      "&callback=" +
      callbackName +
      "&_=" +
      Date.now();


    script.src = url;

    document.body.appendChild(script);
  });
}


/* -----------------------------
   FORM SUBMIT
----------------------------- */

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  const employeeCode =
    codeInput.value.trim();

  if (!employeeCode) {
    setMessage(
      "Please enter your Employee Code.",
      "error"
    );
    return;
  }


  if (
    !APPS_SCRIPT_URL ||
    APPS_SCRIPT_URL.includes("PASTE_YOUR")
  ) {

    setMessage(
      "The certificate portal is not connected to the database yet.",
      "error"
    );

    return;
  }


  lookupBtn.disabled = true;

  panel.hidden = true;

  setMessage(
    "Checking your Employee Code…"
  );


  try {

    const data =
      await lookupEmployeeCode(employeeCode);


    if (!data.success) {

      setMessage(
        data.message ||
        "Certificate not found.",
        "error"
      );

      return;
    }


    currentWinner = data;


    winnerName.textContent =
      data.name;


    winnerText.textContent =
      data.prize
        ? `Winner — ${data.prize}`
        : "Certificate of Achievement";


    await drawCertificate(data);


    panel.hidden = false;


    setMessage(
      "Certificate found successfully.",
      "success"
    );

  } catch (error) {

    console.error(error);

    setMessage(
      error.message ||
      "Unable to connect right now. Please try again.",
      "error"
    );

  } finally {

    lookupBtn.disabled = false;

  }

});


/* -----------------------------
   LOAD TEMPLATE
----------------------------- */

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


/* -----------------------------
   DRAW CERTIFICATE
----------------------------- */

async function drawCertificate(data) {

  await loadImage(template);


  // Make sure Montserrat is loaded
  await document.fonts.load(
    "700 130px Montserrat"
  );


  const ctx =
    canvas.getContext("2d");


  canvas.width =
    template.naturalWidth;

  canvas.height =
    template.naturalHeight;


  // Draw original certificate
  ctx.drawImage(
    template,
    0,
    0
  );


  /*
    NAME POSITION

    Template size:
    2000 x 1414

    The dotted line is below
    the name area.

    This position keeps the
    name comfortably above it.
  */

  const x =
    canvas.width / 2;

  const y =
    735;

  const maxWidth =
    canvas.width * 0.78;

  const startingFontSize =
    130;


  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    "#28469a";


  ctx.font =
    `700 ${startingFontSize}px Montserrat`;


  fitText(
    ctx,
    data.name,
    maxWidth,
    startingFontSize
  );


  ctx.fillText(
    data.name,
    x,
    y
  );

}


/* -----------------------------
   FIT NAME
----------------------------- */

function fitText(
  ctx,
  text,
  maxWidth,
  fontSize
) {

  let size =
    fontSize;


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


/* -----------------------------
   DOWNLOAD PDF
----------------------------- */

downloadBtn.addEventListener(
  "click",
  () => {

    if (!currentWinner) {
      return;
    }


    const { jsPDF } =
      window.jspdf;


    const safeName =
      currentWinner.name
        .replace(
          /[^a-z0-9]+/gi,
          "_"
        )
        .replace(
          /^_|_$/g,
          ""
        ) ||
      "Winner";


    const pdf =
      new jsPDF({

        orientation:
          "landscape",

        unit:
          "mm",

        format:
          "a4",

        compress:
          true

      });


    const pageW =
      pdf.internal.pageSize.getWidth();

    const pageH =
      pdf.internal.pageSize.getHeight();


    const ratio =
      Math.min(
        pageW / canvas.width,
        pageH / canvas.height
      );


    const w =
      canvas.width * ratio;

    const h =
      canvas.height * ratio;


    const x =
      (pageW - w) / 2;

    const y =
      (pageH - h) / 2;


    pdf.addImage(

      canvas.toDataURL(
        "image/png"
      ),

      "PNG",

      x,
      y,
      w,
      h,

      undefined,

      "FAST"

    );


    pdf.save(
      `Financial_Azadi_Certificate_${safeName}.pdf`
    );

  }
);
