/**
 * Financial Azadi Quiz — Certificate Portal backend
 * Google Sheet columns:
 * A = Employee Code
 * B = Name
 * C = Prize (optional)
 */
const SPREADSHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Winners";

function doGet(e) {
  const employeeCode = String(e?.parameter?.employeeCode || "").trim().toUpperCase();
  if (!employeeCode) return json({success:false,message:"Please enter your Employee Code."});
  if (SPREADSHEET_ID.includes("PASTE_YOUR")) return json({success:false,message:"Database is not configured."});

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return json({success:false,message:"Winners sheet not found."});

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const code = String(values[i][0] || "").trim().toUpperCase();
    if (code === employeeCode) {
      return json({
        success:true,
        employeeCode:code,
        name:String(values[i][1] || "").trim(),
        prize:String(values[i][2] || "").trim()
      });
    }
  }
  return json({success:false,message:"No certificate was found for this Employee Code."});
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}