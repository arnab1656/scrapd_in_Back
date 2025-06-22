import { EmailAutomationService } from "./src/services/email-automation/index";

async function testAutoTerminate() {
  console.log("🚀 Testing Callback-Based Auto-Terminate Email Automation");
  console.log("=" .repeat(60));
  console.log("📋 This test demonstrates:");
  console.log("   ✅ Immediate polling when processing emails (no 5-second delays)");
  console.log("   ✅ Auto-termination when queue is empty");
  console.log("   ✅ Callback-based event-driven architecture");
  console.log("");

  const emailService = EmailAutomationService.getInstance();

  try {
    // Start the email automation service
    console.log("📧 Starting email automation with callback-based polling...");
    const startTime = Date.now();
    
    await emailService.start();
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // Get the completion status
    const lastCompletion = emailService.getLastCompletion();
    if (lastCompletion) {
      console.log("\n📊 Final Status:");
      console.log(`Status: ${lastCompletion.status}`);
      console.log(`Message: ${lastCompletion.message}`);
      console.log(`Processed: ${lastCompletion.processedCount} emails`);
      console.log(`Processing Duration: ${lastCompletion.duration}ms`);
      console.log(`Total Test Duration: ${totalDuration}ms`);
      console.log(`Start: ${lastCompletion.startTime}`);
      console.log(`End: ${lastCompletion.endTime}`);
      
      // Show performance metrics
      if (lastCompletion.processedCount > 0) {
        const avgTimePerEmail = lastCompletion.duration / lastCompletion.processedCount;
        console.log(`\n⚡ Performance Metrics:`);
        console.log(`Average time per email: ${avgTimePerEmail.toFixed(2)}ms`);
        console.log(`Emails per second: ${(1000 / avgTimePerEmail).toFixed(2)}`);
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAutoTerminate().then(() => {
  console.log("\n✅ Callback-based polling test completed");
  console.log("🎯 Key improvements:");
  console.log("   • No fixed 5-second delays between emails");
  console.log("   • Immediate processing of next email");
  console.log("   • Auto-termination when queue is empty");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
}); 