const XLSX = require('xlsx');
const path = require('path');

const headers = ["Full Name", "Username", "Employee ID", "Role", "Reports To (Emp ID)", "Email Address", "Password", "Confirm Password"];
const data = [
  ["Amit Kumar", "amit_admin", "IMS2001", "admin", "", "amit@example.com", "Amit@123", "Amit@123"],
  ["Suresh Sharma", "suresh_mgr", "IMS2002", "manager", "", "suresh@example.com", "Suresh@123", "Suresh@123"],
  ["Rahul Varma", "rahul_agent", "IMS2003", "agent", "IMS2002", "rahul@example.com", "Rahul@123", "Rahul@123"],
  ["Priya Singh", "priya_agent", "IMS2004", "agent", "IMS2002", "priya@example.com", "Priya@123", "Priya@123"]
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test Users");

const filePath = path.join(process.cwd(), 'test_users_bulk_upload.xlsx');
XLSX.writeFile(wb, filePath);

console.log('Excel file created at:', filePath);
