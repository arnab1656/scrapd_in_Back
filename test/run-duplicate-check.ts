import { DuplicateChecker } from './duplicate-checker';

async function runDuplicateCheck(): Promise<void> {
  try {
    console.log('🚀 Starting Database Duplicate Check...\n');
    
    const checker = DuplicateChecker.getInstance();
    
    // Run the duplicate check
    await checker.checkAllTables();
    
    // Generate detailed report
    await checker.generateDetailedReport();
    
    console.log('\n✅ Duplicate check completed successfully!');
  } catch (error) {
    console.error('❌ Error running duplicate check:', error);
    process.exit(1);
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  runDuplicateCheck()
    .then(() => {
      console.log('🎉 All checks completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { runDuplicateCheck }; 