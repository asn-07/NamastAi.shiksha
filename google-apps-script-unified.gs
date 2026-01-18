/**
 * ============================================================================
 * UNIFIED Google Apps Script for NamastAI.shiksha
 * ============================================================================
 * This script handles:
 * 1. Quiz completion tracking (from quiz.html)
 * 2. Certificate verification (from verify.html)
 * 3. Student enrollment verification (from curriculum.html)
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste this ENTIRE script
 * 5. Click Save (💾 icon)
 * 6. Create a sheet named "Students" with columns: Name, Phone, Enable
 * 7. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Copy the Web App URL
 * 9. Update quiz.html, verify.html, and curriculum.html with this URL
 * 
 * ============================================================================
 */

// ============================================================================
// HANDLE GET REQUESTS (Certificate Verification & Student Verification)
// ============================================================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Handle student verification
    if (action === 'verifyStudent') {
      return verifyStudent(e.parameter.name, e.parameter.phone);
    }
    
    // Handle certificate verification (default behavior)
    const certificateUUID = e.parameter.id;
    
    if (!certificateUUID) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Certificate ID required'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Quiz Completions');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'No certificates found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find certificate by UUID (column index 9: Certificate UUID)
    const uuidIndex = 9; // Certificate UUID is at column index 9
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][uuidIndex] === certificateUUID) {
        const certificate = {
          Timestamp: data[i][0],
          QuizTopic: data[i][1],
          StudentName: data[i][2],
          StudentEmail: data[i][3],
          Score: data[i][4],
          TotalQuestions: data[i][5],
          Percentage: data[i][6],
          Passed: data[i][7],
          CompletionDate: data[i][8],
          CertificateUUID: data[i][9],
          CertificateDownloaded: data[i][10],
          DownloadTimestamp: data[i][11],
          UserAgent: data[i][12],
          Referrer: data[i][13]
        };
        
        // Track this verification in a separate sheet
        trackVerification(ss, certificateUUID);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            certificate: certificate,
            message: 'Certificate verified successfully'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Certificate not found'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Server error occurred'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// HANDLE POST REQUESTS (Quiz Submissions & Download Tracking)
// ============================================================================
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if this is a download tracking update
    if (data.action === 'download') {
      return trackDownload(ss, data);
    } else {
      // This is a new quiz submission
      return recordQuizCompletion(ss, data);
    }
    
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// RECORD QUIZ COMPLETION
// ============================================================================
function recordQuizCompletion(ss, data) {
  // Get or create the "Quiz Completions" sheet
  let sheet = ss.getSheetByName('Quiz Completions');
  
  if (!sheet) {
    sheet = ss.insertSheet('Quiz Completions');
    
    // Add headers
    const headers = [
      'Timestamp',
      'Quiz Topic',
      'Student Name',
      'Email',
      'Score',
      'Total Questions',
      'Percentage',
      'Passed',
      'Completion Date',
      'Certificate UUID',
      'Certificate Downloaded',
      'Download Timestamp',
      'User Agent',
      'Referrer'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  
  // Prepare row data
  const rowData = [
    data.timestamp,
    data.quizTopic || 'Not Specified',
    data.studentName,
    data.studentEmail,
    data.score,
    data.totalQuestions,
    data.percentage + '%',
    data.passed ? 'Yes' : 'No',
    data.completionDate,
    data.certificateUUID,
    data.certificateDownloaded ? 'Yes' : 'No',
    '', // Download timestamp (will be filled when download happens)
    data.userAgent,
    data.referrer
  ];
  
  // Append the row
  sheet.appendRow(rowData);
  
  // Format the new row
  const lastRow = sheet.getLastRow();
  
  // Color code based on pass/fail (column 8 = Passed)
  if (data.passed) {
    sheet.getRange(lastRow, 8).setBackground('#d9ead3'); // Light green for passed
  } else {
    sheet.getRange(lastRow, 8).setBackground('#f4cccc'); // Light red for failed
  }
  
  Logger.log('Quiz completion recorded for: ' + data.studentName);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Data recorded successfully'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// TRACK CERTIFICATE DOWNLOAD
// ============================================================================
function trackDownload(ss, data) {
  const sheet = ss.getSheetByName('Quiz Completions');
  
  if (!sheet) {
    Logger.log('Quiz Completions sheet not found');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Find the row with matching certificate UUID
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) { // Start at 1 to skip header
    const certificateUUID = values[i][9]; // Certificate UUID column (index 9)
    
    if (certificateUUID === data.certificateUUID) {
      // Update the download status and timestamp
      sheet.getRange(i + 1, 11).setValue('Yes'); // Certificate Downloaded (column 11)
      sheet.getRange(i + 1, 12).setValue(data.downloadTimestamp); // Download Timestamp (column 12)
      
      // Highlight the download column
      sheet.getRange(i + 1, 11).setBackground('#b6d7a8'); // Light green
      
      Logger.log('Download tracked for certificate: ' + data.certificateUUID);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Download tracked successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  Logger.log('Certificate UUID not found: ' + data.certificateUUID);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Certificate not found'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// TRACK VERIFICATION (Optional - creates a log of verifications)
// ============================================================================
function trackVerification(ss, certificateUUID) {
  try {
    // Get or create verification log sheet
    let logSheet = ss.getSheetByName('Verification Log');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('Verification Log');
      
      // Add headers
      const headers = ['Timestamp', 'Certificate UUID', 'IP/Location'];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      logSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#34a853')
        .setFontColor('#ffffff');
      
      logSheet.setFrozenRows(1);
    }
    
    // Log this verification
    logSheet.appendRow([
      new Date().toISOString(),
      certificateUUID,
      'Web Verification'
    ]);
    
    Logger.log('Verification logged for: ' + certificateUUID);
    
  } catch (error) {
    Logger.log('Error tracking verification: ' + error.toString());
    // Don't fail the main request if logging fails
  }
}

// ============================================================================
// VERIFY STUDENT ENROLLMENT
// ============================================================================
function verifyStudent(name, phone) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const studentsSheet = ss.getSheetByName('Students');
    
    if (!studentsSheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          verified: false,
          message: 'Students sheet not found. Please contact administrator.'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = studentsSheet.getDataRange().getValues();
    
    // Assuming columns: Name (0), Phone (1), Enable (2)
    for (let i = 1; i < data.length; i++) {
      const studentName = String(data[i][0]).trim().toLowerCase();
      const studentPhone = String(data[i][1]).trim();
      const enabled = String(data[i][2]).trim().toLowerCase();
      
      const inputName = String(name).trim().toLowerCase();
      const inputPhone = String(phone).trim();
      
      if (studentName === inputName && studentPhone === inputPhone) {
        // Student found in sheet
        if (enabled === 'yes' || enabled === 'y' || enabled === 'true' || enabled === '1') {
          // Student is enabled
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true,
              verified: true,
              enabled: true,
              studentName: data[i][0],
              message: 'Welcome! You are enrolled and verified.',
              courses: [
                {
                  title: 'Java Language Fundamentals',
                  theoryLink: 'lang-funda.html',
                  quizLink: 'lang-funda-quiz.html',
                  description: 'Master the core concepts of Java programming'
                },
                {
                  title: 'Operators in Java',
                  theoryLink: 'operators-theory.html',
                  quizLink: 'operators-quiz.html',
                  description: 'Learn about different types of operators'
                }
              ]
            }))
            .setMimeType(ContentService.MimeType.JSON);
        } else {
          // Student found but not enabled
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true,
              verified: false,
              enabled: false,
              message: 'Your enrollment is pending approval. Please contact administration.'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // Student not found
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        verified: false,
        message: 'Student not found. Please enroll first.'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Student Verification Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Error verifying student'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// OPTIONAL: GET QUIZ STATISTICS
// ============================================================================
function getQuizStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Quiz Completions');
  
  if (!sheet) {
    Logger.log('No data yet');
    return;
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  let totalSubmissions = values.length - 1; // Exclude header
  let passed = 0;
  let failed = 0;
  let downloaded = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][7] === 'Yes') passed++; // Passed column (index 7)
    else failed++;
    
    if (values[i][10] === 'Yes') downloaded++; // Certificate Downloaded (index 10)
  }
  
  Logger.log('=== Quiz Statistics ===');
  Logger.log('Total Submissions: ' + totalSubmissions);
  Logger.log('Passed: ' + passed);
  Logger.log('Failed: ' + failed);
  Logger.log('Certificates Downloaded: ' + downloaded);
  
  return {
    total: totalSubmissions,
    passed: passed,
    failed: failed,
    downloaded: downloaded
  };
}

// ============================================================================
// OPTIONAL: GET VERIFICATION STATS
// ============================================================================
function getVerificationStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('Verification Log');
  
  if (!logSheet) {
    Logger.log('No verification log yet');
    return;
  }
  
  const dataRange = logSheet.getDataRange();
  const values = dataRange.getValues();
  
  let totalVerifications = values.length - 1; // Exclude header
  
  Logger.log('=== Verification Statistics ===');
  Logger.log('Total Verifications: ' + totalVerifications);
  
  return {
    total: totalVerifications
  };
}
