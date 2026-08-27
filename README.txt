# Financial Azadi Certificate Portal - Local Lookup Fix

Generated from the uploaded Excel file with 191 winner records.

B1630 maps to: Bhakti Deepak Parmar — 1st Prize.

## Upload these files to the live repository

- data.js
- script.js
- index.html
- style.css

Keep your existing `Asset/certificate-template.png`.

The website no longer contacts Google Apps Script for certificate lookup, so the browser cannot get stuck waiting for the certificate server.

Employee code lookup is exact after trimming and converting to uppercase.
