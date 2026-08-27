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


/* ================================
   MESSAGE
================================ */

function setMessage(text, type = "") {
    message.textContent = text;
    message.className = "message " + type;
}


/* ================================
   JSONP LOOKUP
================================ */

function lookupEmployee(employeeCode) {

    return new Promise((resolve, reject) => {

        const callbackName =
            "certificateCallback_" + Date.now();

        const script =
            document.createElement("script");

        let finished = false;

        const timeout =
            setTimeout(() => {

                if (finished) return;

                finished = true;

                cleanup();

                reject(
                    new Error(
                        "Unable to connect to the certificate server."
                    )
                );

            }, 15000);


        function cleanup() {

            clearTimeout(timeout);

            try {
                delete window[callbackName];
            } catch (error) {
                window[callbackName] = undefined;
            }

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }


        window[callbackName] = function(data) {

            if (finished) return;

            finished = true;

            cleanup();

            resolve(data);

        };


        script.onerror = function() {

            if (finished) return;

            finished = true;

            cleanup();

            reject(
                new Error(
                    "Unable to reach the certificate server."
                )
            );

        };


        const requestUrl =
            APPS_SCRIPT_URL +
            "?employeeCode=" +
            encodeURIComponent(employeeCode) +
            "&callback=" +
            encodeURIComponent(callbackName) +
            "&cache=" +
            Date.now();


        script.src = requestUrl;

        document.head.appendChild(script);

    });

}


/* ================================
   FORM
================================ */

form.addEventListener(
    "submit",
    async function(event) {

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
                "Certificate portal is not connected.",
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

            const data =
                await lookupEmployee(
                    employeeCode
                );


            if (!data.success) {

                setMessage(
                    data.message ||
                    "No certificate found.",
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
                "Unable to connect right now.",
                "error"
            );

        } finally {

            lookupBtn.disabled = false;

        }

    }
);


/* ================================
   IMAGE LOADER
================================ */

function loadImage(image) {

    return new Promise(
        (resolve, reject) => {

            if (
                image.complete &&
                image.naturalWidth
            ) {

                resolve(image);

                return;
            }


            image.onload =
                () => resolve(image);


            image.onerror =
                () =>
                    reject(
                        new Error(
                            "Certificate template could not be loaded."
                        )
                    );

        }
    );

}


/* ================================
   CERTIFICATE
================================ */

async function drawCertificate(data) {

    await loadImage(template);


    /* Wait for Montserrat */
    await document.fonts.load(
        "700 130px Montserrat"
    );


    const ctx =
        canvas.getContext("2d");


    canvas.width =
        template.naturalWidth;


    canvas.height =
        template.naturalHeight;


    /* Draw the original template */

    ctx.drawImage(
        template,
        0,
        0
    );


    /*
       NAME SETTINGS

       Template:
       2000 x 1414 px

       Name is centered and placed
       safely above the dotted line.
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
        data.name,
        maxWidth,
        startingSize
    );


    ctx.fillText(
        data.name,
        centerX,
        nameY
    );

}


/* ================================
   FIT NAME
================================ */

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


/* ================================
   DOWNLOAD PDF
================================ */

downloadBtn.addEventListener(
    "click",
    function() {

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

            canvas.toDataURL(
                "image/png"
            ),

            "PNG",

            x,
            y,

            width,
            height,

            undefined,

            "FAST"

        );


        pdf.save(
            `Financial_Azadi_Certificate_${safeName}.pdf`
        );

    }
);
