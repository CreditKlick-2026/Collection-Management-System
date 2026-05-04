const fs = require('fs');

const headers = [
  "Account Number", "Customer Name", "Mobile Number", "Alt Mobile", "Email", 
  "PAN Number", "Product Type", "Bank / Lender", "Total Outstanding", 
  "Principle Outstanding", "Min Amount Due", "DPD", "Bucket", "Status", 
  "City", "State", "Address", "Portfolio", "Eligible For Update",
  // Additional missing fields
  "Alt Mobile 2", "Alt Mobile 3", "Alt Mobile 4", "Product NPA", "Date of NPA",
  "Date of Birth", "Gender", "Employer", "Salary", "Assigned Agent", "Pincode"
];

const firstNames = ["Rahul", "Amit", "Priya", "Sneha", "Vikram", "Rohan", "Anjali", "Neha", "Sanjay", "Kiran"];
const lastNames = ["Sharma", "Verma", "Singh", "Patel", "Gupta", "Kumar", "Reddy", "Joshi", "Iyer", "Nair"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];
const states = ["Maharashtra", "Delhi", "Karnataka", "Telangana", "Maharashtra", "Tamil Nadu", "West Bengal", "Gujarat"];
const banks = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"];
const products = ["Personal Loan", "Credit Card", "Auto Loan", "Home Loan"];
const employers = ["TCS", "Infosys", "Wipro", "Reliance", "Self Employed", "Government", "HDFC Bank"];
const genders = ["Male", "Female"];

let csvContent = headers.join(',') + '\n';

for (let i = 1; i <= 1000; i++) {
  const accNo = `LN-2024-${String(i).padStart(5, '0')}`;
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const mobile = `9${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const altMobile = `8${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const email = `${name.replace(' ', '.').toLowerCase()}@example.com`;
  const pan = `ABCDE${Math.floor(Math.random() * 9000 + 1000)}F`;
  const product = products[Math.floor(Math.random() * products.length)];
  const bank = banks[Math.floor(Math.random() * banks.length)];
  const outstanding = Math.floor(Math.random() * 500000 + 10000);
  const principle = Math.floor(outstanding * 0.8);
  const minDue = Math.floor(outstanding * 0.1);
  const dpd = Math.floor(Math.random() * 365);
  const bucket = `B${Math.floor(dpd / 30) + 1}`;
  const status = "Active";
  const cityIdx = Math.floor(Math.random() * cities.length);
  const city = cities[cityIdx];
  const state = states[cityIdx];
  const address = `Flat ${Math.floor(Math.random() * 100)}, Building ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}, ${city}`;
  const portfolio = "Default";
  const eligible = "Y";

  // New missing fields
  const altMobile2 = `7${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const altMobile3 = `6${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const altMobile4 = ``;
  const productNpa = "N";
  const dateOfNpa = "2023-12-01";
  
  // Random DOB
  const dobYear = 1970 + Math.floor(Math.random() * 30);
  const dobMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const dobDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const dob = `${dobYear}-${dobMonth}-${dobDay}`;
  
  const gender = genders[Math.floor(Math.random() * genders.length)];
  const employer = employers[Math.floor(Math.random() * employers.length)];
  const salary = Math.floor(Math.random() * 150000 + 20000);
  const assignedAgent = ""; // Empty to prevent relation errors if user doesn't exist
  const pincode = Math.floor(Math.random() * 899999 + 100000);

  const row = [
    accNo, name, mobile, altMobile, email, pan, product, bank,
    outstanding, principle, minDue, dpd, bucket, status, city, state,
    `"${address}"`, portfolio, eligible,
    altMobile2, altMobile3, altMobile4, productNpa, dateOfNpa,
    dob, gender, employer, salary, assignedAgent, pincode
  ];

  csvContent += row.join(',') + '\n';
}

fs.writeFileSync('test_data_1000.csv', csvContent);
console.log("✅ Successfully created test_data_1000.csv with ALL 30 columns!");
