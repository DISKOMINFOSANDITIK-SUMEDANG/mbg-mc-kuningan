const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to generate email from school name
function generateEmail(schoolName) {
  // Clean and simplify school name
  const cleanName = schoolName
    .toLowerCase()
    .replace(/\s+/g, '')  // Remove all spaces
    .replace(/[^a-z0-9]/g, '')  // Remove special characters
    .substring(0, 20);  // Limit to 20 chars
  
  return `${cleanName}@kuningankab.go.id`;
}

// Function to generate random password
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const specialChars = '!@#$%';
  let password = '';
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add 1 special character
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Add 3 digits
  for (let i = 0; i < 3; i++) {
    password += Math.floor(Math.random() * 10);
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function main() {
  console.log('🚀 Starting school account creation process...\n');

  // Step 1: Fetch all schools from database (paginated)
  console.log('📚 Fetching schools from database...');
  
  let allSchools = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: schoolsBatch, error: fetchError } = await supabase
      .from('schools')
      .select('id, name, level, district, village, address')
      .order('name')
      .range(from, from + pageSize - 1);

    if (fetchError) {
      console.error('Error fetching schools:', fetchError);
      process.exit(1);
    }

    allSchools = allSchools.concat(schoolsBatch);
    
    if (schoolsBatch.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      console.log(`  Fetched ${allSchools.length} schools so far...`);
    }
  }

  const schools = allSchools;
  console.log(`✅ Found ${schools.length} schools total\n`);

  // Step 2: Get unique schools by name (skip duplicates)
  console.log('🔄 Filtering unique schools by name...');
  const uniqueSchools = [];
  const seenNames = new Set();  // Set to track seen school names
  const duplicateSchools = [];  // Track duplicates for reporting
  
  schools.forEach(school => {
    const nameLower = school.name.toLowerCase().trim();
    if (!seenNames.has(nameLower)) {
      seenNames.add(nameLower);
      uniqueSchools.push(school);
    } else {
      duplicateSchools.push(school.name);
    }
  });
  
  console.log(`✅ Found ${uniqueSchools.length} unique schools`);
  console.log(`⚠️  Skipped ${duplicateSchools.length} duplicate school names\n`);

  // Step 3: Check for existing school users to avoid duplicates
  console.log('🔍 Checking for existing school accounts...');
  const { data: existingUsers, error: existingError } = await supabase
    .from('users')
    .select('id, email, school_users(school_id)')
    .eq('role', 'sekolah');

  if (existingError) {
    console.error('Error fetching existing users:', existingError);
    process.exit(1);
  }

  const existingSchoolIds = new Set();
  if (existingUsers) {
    existingUsers.forEach(user => {
      if (user.school_users && user.school_users.length > 0) {
        user.school_users.forEach(su => {
          existingSchoolIds.add(su.school_id);
        });
      }
    });
  }

  console.log(`✅ Found ${existingSchoolIds.size} existing school accounts\n`);

  // Step 4: Filter schools that don't have accounts yet
  const schoolsToCreate = uniqueSchools.filter(school => !existingSchoolIds.has(school.id));
  
  console.log(`📝 Will create accounts for ${schoolsToCreate.length} schools\n`);

  if (schoolsToCreate.length === 0) {
    console.log('✅ All schools already have accounts!');
    return;
  }

  // Step 4: Create accounts
  const accountsData = [];
  const createdAccounts = [];
  const failedAccounts = [];

  console.log('🔐 Creating accounts...\n');

  for (let i = 0; i < schoolsToCreate.length; i++) {
    const school = schoolsToCreate[i];
    const email = generateEmail(school.name);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      // Insert user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: email,
          password_hash: passwordHash,
          role: 'sekolah',
          is_active: true
        })
        .select()
        .single();

      if (userError) throw userError;

      // Insert user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: school.name,
          phone: null
        });

      if (profileError) throw profileError;

      // Insert school_users relation
      const { error: schoolUserError } = await supabase
        .from('school_users')
        .insert({
          user_id: user.id,
          school_id: school.id,
          position: 'Kepala Sekolah'
        });

      if (schoolUserError) throw schoolUserError;

      accountsData.push({
        school_id: school.id,
        school_name: school.name,
        level: school.level,
        district: school.district,
        village: school.village,
        address: school.address,
        email: email,
        password: password,
        user_id: user.id,
        status: 'Created'
      });

      createdAccounts.push(school.name);

      if ((i + 1) % 50 === 0) {
        console.log(`✅ Progress: ${i + 1}/${schoolsToCreate.length} accounts created`);
      }

    } catch (error) {
      console.error(`❌ Failed to create account for ${school.name}:`, error.message);
      failedAccounts.push({
        school_name: school.name,
        email: email,
        error: error.message
      });
      
      // Don't add failed accounts to Excel
    }
  }

  console.log(`\n✅ Successfully created ${createdAccounts.length} accounts`);
  if (failedAccounts.length > 0) {
    console.log(`❌ Failed to create ${failedAccounts.length} accounts`);
  }

  // Step 5: Generate Excel file
  console.log('\n📊 Generating Excel file...');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('School Accounts');

  // Add headers
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'School ID', key: 'school_id', width: 38 },
    { header: 'School Name', key: 'school_name', width: 50 },
    { header: 'Level', key: 'level', width: 10 },
    { header: 'District', key: 'district', width: 20 },
    { header: 'Village', key: 'village', width: 20 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'Email', key: 'email', width: 60 },
    { header: 'Password', key: 'password', width: 20 },
    { header: 'User ID', key: 'user_id', width: 38 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3b82f6' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Add data
  accountsData.forEach((account, index) => {
    worksheet.addRow({
      no: index + 1,
      ...account
    });
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'K1'
  };

  // Save file
  const filename = `school_accounts_${new Date().toISOString().split('T')[0]}.xlsx`;
  const filepath = path.join(__dirname, '..', filename);
  
  await workbook.xlsx.writeFile(filepath);

  console.log(`✅ Excel file created: ${filename}`);
  console.log(`📂 Location: ${filepath}\n`);

  // Summary
  console.log('📋 SUMMARY:');
  console.log('═══════════════════════════════════════');
  console.log(`Total Schools: ${schools.length}`);
  console.log(`Unique School Names: ${uniqueSchools.length}`);
  console.log(`Duplicate Names Skipped: ${duplicateSchools.length}`);
  console.log(`Existing Accounts: ${existingSchoolIds.size}`);
  console.log(`New Accounts Created: ${createdAccounts.length}`);
  console.log(`Failed: ${failedAccounts.length}`);
  console.log(`Excel File: ${filename}`);
  console.log('═══════════════════════════════════════\n');

  if (failedAccounts.length > 0) {
    console.log('❌ Failed Accounts:');
    failedAccounts.forEach(f => {
      console.log(`   - ${f.school_name}: ${f.error}`);
    });
    console.log('');
  }

  console.log('✅ Process completed successfully!\n');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
