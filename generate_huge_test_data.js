const fs = require('fs');
const path = require('path');

const FILE_NAME = 'huge_test_data.csv';
const ROW_COUNT = 150000; // This should result in ~30MB file

const headers = [
  "Account Number", "Customer Name", "Mobile Number", "Total Outstanding", "Principle Outstanding", 
  "Min Amount Due", "DPD", "Product Type", "Bank / Lender", "PAN Number", "Status", "Portfolio", 
  "Assigned Agent", "City", "State", "Email", "Alt Mobile", "Address", "Bucket", "Eligible_For_Update"
];

console.log(`🚀 Generating ${ROW_COUNT} records for testing (Target: ~30MB)...`);

const writeStream = fs.createWriteStream(path.join(__dirname, FILE_NAME));

// Write Header
writeStream.write(headers.join(',') + '\n');

const portfolios = ['P1', 'P2', 'P3', 'Retail', 'Corporate'];
const buckets = ['B1', 'B2', 'B3', 'B4', 'NPA'];
const statuses = ['pending', 'active', 'closed', 'settled'];
const upgradeValues = ['Yes', 'No', 'Y', 'N', '', 'True', 'False'];

for (let i = 1; i <= ROW_COUNT; i++) {
  const isDuplicate = i % 10 === 0;
  const accId = isDuplicate ? Math.floor(i / 10) : i;
  
  const row = [
    `ACC-TEST-${1000000 + accId}`,
    `Test User ${accId}`,
    `${9000000000 + (accId % 999999999)}`,
    Math.floor(Math.random() * 500000),
    Math.floor(Math.random() * 400000),
    Math.floor(Math.random() * 10000),
    Math.floor(Math.random() * 180),
    (accId % 2 === 0 ? "Personal Loan" : "Credit Card"),
    (accId % 3 === 0 ? "HDFC" : accId % 3 === 1 ? "SBI" : "ICICI"),
    `PAN${10000 + accId}Z`,
    statuses[accId % statuses.length],
    portfolios[accId % portfolios.length],
    `agent_${accId % 5}`,
    "Sample City",
    "Sample State",
    `user${accId}@test.com`,
    `9${accId}0000000`.substring(0, 10),
    `Sample Address Line ${accId}`,
    buckets[accId % buckets.length],
    upgradeValues[accId % upgradeValues.length]
  ];

  writeStream.write(row.join(',') + '\n');

  if (i % 25000 === 0) {
    console.log(`✅ ${i} records written...`);
  }
}

writeStream.end();
writeStream.on('finish', () => {
  const stats = fs.statSync(path.join(__dirname, FILE_NAME));
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n✨ SUCCESS! File generated: ${FILE_NAME}`);
  console.log(`📦 Size: ${sizeInMB} MB`);
  console.log(`📊 Rows: ${ROW_COUNT}`);
  console.log(`\nNow upload this file to test the 30MB upload limit!`);
});
