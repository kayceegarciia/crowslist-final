import { db } from "../lib/db";
import { resetAndSeedMarketplaceData } from "../lib/reset-and-seed";

async function main() {
  const result = await resetAndSeedMarketplaceData(db, {
    userCount: 10,
    postCount: 30,
    forceApproved: true,
  });

  console.log("Reset + seed complete");
  console.log(
    JSON.stringify(
      {
        deletedPosts: result.deletedPosts,
        deletedFeedback: result.deletedFeedback,
        deletedPostNotifications: result.deletedPostNotifications,
        createdUsers: result.createdUsers,
        updatedUsers: result.updatedUsers,
        createdPosts: result.createdPosts,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
