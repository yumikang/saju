import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Migrate existing users with provider/providerId to new UserOAuth structure
 * This script is idempotent - safe to run multiple times
 */
async function migrateOAuthData() {
  console.log("Starting OAuth data migration...");

  try {
    // Get all users with provider data (from old schema)
    const usersWithProvider = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string | null;
        avatar_url: string | null;
        provider: string | null;
        provider_id: string | null;
      }>
    >`
      SELECT id, email, name, avatar_url, provider, provider_id
      FROM users
      WHERE provider IS NOT NULL AND provider_id IS NOT NULL
    `;

    console.log(`Found ${usersWithProvider.length} users with OAuth data to migrate`);

    for (const user of usersWithProvider) {
      // Check if UserOAuth already exists
      const existingOAuth = await prisma.userOAuth.findUnique({
        where: {
          provider_providerUserId: {
            provider: user.provider as any,
            providerUserId: user.provider_id!,
          },
        },
      });

      if (!existingOAuth) {
        // Create UserOAuth record
        await prisma.userOAuth.create({
          data: {
            userId: user.id,
            provider: user.provider as any,
            providerUserId: user.provider_id!,
            email: user.email,
            emailVerified: true, // Assume verified since they were able to login
            name: user.name,
            profileImage: user.avatar_url,
            profileRaw: {
              migrated: true,
              migratedAt: new Date().toISOString(),
            },
          },
        });

        console.log(`Migrated OAuth data for user: ${user.email}`);
      } else {
        console.log(`OAuth data already exists for user: ${user.email}`);
      }
    }

    // Clean up old columns (optional - comment out if you want to keep them for now)
    // await prisma.$executeRaw`ALTER TABLE users DROP COLUMN IF EXISTS provider`;
    // await prisma.$executeRaw`ALTER TABLE users DROP COLUMN IF EXISTS provider_id`;

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateOAuthData()
  .then(() => {
    console.log("✅ OAuth migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ OAuth migration failed:", error);
    process.exit(1);
  });

export { migrateOAuthData };