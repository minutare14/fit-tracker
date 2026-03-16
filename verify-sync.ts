import { HevyService } from "./src/integrations/hevy/service";
import prisma from "./src/lib/prisma";

async function verify() {
  console.log("--- HEVY SYNC VERIFICATION ---");
  const userId = "test-user-verification";
  
  try {
    // 1. Create User
    console.log("1. Ensuring test user exists...");
    const user = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: { id: userId },
      create: { id: userId, email: "test@example.com", name: "Test User" }
    });
    console.log("User ready.");

    // 2. Mock/Check Connection (Need valid API Key for real test, but let's check current config)
    console.log("2. Checking Hevy connection...");
    // If the user hasn't provided one, this will still fail but with a clearer message
    const connection = await prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: 'HEVY' } }
    });
    
    if (!connection) {
       console.log("No Hevy connection found. Please configure an API Key in the UI.");
       return;
    }

    // 3. Trigger Sync
    console.log("3. Triggering sync...");
    const service = new HevyService();
    const result = await service.syncProgramToHevy(userId);
    console.log("Sync Result:", JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
