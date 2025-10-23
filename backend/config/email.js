// Simplified email configuration without nodemailer
// Perfect for development - logs emails to console

const sendEmail = async (to, subject, html) => {
  try {
    console.log('\n📧 ===== EMAIL NOTIFICATION =====');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Body:', html.replace(/<[^>]*>/g, '').substring(0, 150) + '...');
    console.log('📧 ===============================\n');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error('❌ Email simulation error:', error);
    return false;
  }
};

const emailTemplates = {
  leaveApplication: (employeeName, leaveType, startDate, endDate, reason) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">New Leave Application</h2>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Type:</strong> ${leaveType}</p>
        <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please log in to the Smart Register system to review this application.</p>
      </div>
    `;
  },
  
  leaveStatusUpdate: (employeeName, leaveType, status, startDate, endDate, rejectionReason = '') => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">Leave Application Update</h2>
        <p>Dear ${employeeName},</p>
        <p>Your leave application has been <strong>${status}</strong>.</p>
        <p><strong>Type:</strong> ${leaveType}</p>
        <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
        ${rejectionReason ? `<p><strong>Reason for rejection:</strong> ${rejectionReason}</p>` : ''}
        <p>If you have any questions, please contact your manager.</p>
      </div>
    `;
  },
  
  attendanceReminder: (employeeName, reminderType) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">Attendance Reminder</h2>
        <p>Dear ${employeeName},</p>
        <p>This is a reminder to <strong>${reminderType}</strong>.</p>
        <p>Please remember to clock ${reminderType === 'clock in' ? 'in to start your work day' : 'out to end your work day'}.</p>
      </div>
    `;
  }
};

module.exports = { sendEmail, emailTemplates };