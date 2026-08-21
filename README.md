# Financial Azadi Quiz — Winner Certificate Portal

QR code → Employee Code → Google Apps Script → personal certificate → PDF download.

## Google Sheet
Create a sheet named `Winners` with:

| Employee Code | Name | Prize |
|---|---|---|
| SMC001 | Example Name | 1st Prize |

## Setup
1. Open `apps-script/Code.gs` in Google Apps Script.
2. Set `SPREADSHEET_ID` to your Google Sheet ID.
3. Deploy the Apps Script as a Web app, executing as you, with access set to anyone who has the link.
4. Copy the `/exec` URL into `config.js`.
5. Enable GitHub Pages from Settings → Pages → Deploy from branch → `main` → root.
6. Use the GitHub Pages URL for the QR code.

Employee Code is the only lookup field. Anyone who knows another employee's code could access that certificate, so keep codes private.