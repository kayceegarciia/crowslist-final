import { db } from "../lib/db";

const AVATAR_POOL = [
  "/placeholder-avatar.svg",
  "/placeholder-avatar.svg?variant=2",
  "/placeholder-avatar.svg?variant=3",
  "/placeholder-avatar.svg?variant=4",
  "/placeholder-avatar.svg?variant=5",
  "/placeholder-avatar.svg?variant=6",
  "/placeholder-avatar.svg?variant=7",
  "/placeholder-avatar.svg?variant=8",
  "/placeholder-avatar.svg?variant=9",
  "/placeholder-avatar.svg?variant=10",
];

const POST_IMAGE_POOL = [
  "/placeholder-product.svg",
  "/placeholder-product.svg?variant=2",
  "/placeholder-product.svg?variant=3",
  "/placeholder-product.svg?variant=4",
  "/placeholder-product.svg?variant=5",
  "/placeholder-product.svg?variant=6",
];

function shouldReplaceImage(image: string | null | undefined): boolean {
  if (!image || image.trim().length === 0) {
    return true;
  }

  return (
    image.includes("images.unsplash.com") ||
    image.includes("i.pravatar.cc") ||
    image === "undefined" ||
    image === "null"
  );
}

function pickByIndex<T>(items: T[], index: number): T {
  return items[index % items.length] as T;
}

async function backfillUsers() {
  const users = await db.user.findMany({
    select: {
      id: true,
      image: true,
    },
  });

  let updated = 0;

  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    if (!shouldReplaceImage(user.image)) {
      continue;
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        image: pickByIndex(AVATAR_POOL, index),
      },
    });

    updated += 1;
  }

  return { total: users.length, updated };
}

async function backfillPosts() {
  const posts = await db.post.findMany({
    select: {
      id: true,
      images: true,
    },
  });

  let updated = 0;

  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index];
    const images = post.images ?? [];
    const validImages = images.filter((image) => !shouldReplaceImage(image));

    if (validImages.length > 0) {
      continue;
    }

    await db.post.update({
      where: { id: post.id },
      data: {
        images: [pickByIndex(POST_IMAGE_POOL, index)],
      },
    });

    updated += 1;
  }

  return { total: posts.length, updated };
}

async function main() {
  const userResult = await backfillUsers();
  const postResult = await backfillPosts();

  console.log("Generic image backfill complete");
  console.log(
    JSON.stringify(
      {
        usersUpdated: userResult.updated,
        usersScanned: userResult.total,
        postsUpdated: postResult.updated,
        postsScanned: postResult.total,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
