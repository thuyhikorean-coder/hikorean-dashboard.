function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Xử lý dữ liệu từ form gửi lên
    var name = e.parameter.name || "Ẩn danh";
    var classId = e.parameter.classId || "Không rõ";
    var teacher = e.parameter.teacher || "Không rõ";
    var r1 = e.parameter.r1 || "";
    var r2 = e.parameter.r2 || "";
    var r3 = e.parameter.r3 || "";
    var r4 = e.parameter.r4 || "";
    var r5 = e.parameter.r5 || "";
    var avg = e.parameter.avg || "";
    var comments = e.parameter.comments || "";

    var date = new Date();

    // Chèn vào dòng mới của Sheet
    sheet.appendRow([date, name, classId, teacher, r1, r2, r3, r4, r5, avg, comments]);

    return ContentService.createTextOutput(JSON.stringify({ "status": "success" })).setMimeType(ContentService.MimeType.JSON);
}
