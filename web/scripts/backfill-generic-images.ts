import { db } from "../lib/db";

const AVATAR_POOL = [
  "https://i.pravatar.cc/300?img=1",
  "https://i.pravatar.cc/300?img=5",
  "https://i.pravatar.cc/300?img=9",
  "https://i.pravatar.cc/300?img=13",
  "https://i.pravatar.cc/300?img=17",
  "https://i.pravatar.cc/300?img=21",
  "https://i.pravatar.cc/300?img=25",
  "https://i.pravatar.cc/300?img=29",
  "https://i.pravatar.cc/300?img=33",
  "https://i.pravatar.cc/300?img=37",
];

const POST_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&w=1200&q=80",
];

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
    const hasImage = Boolean(user?.image && user.image.trim().length > 0);

    if (hasImage) {
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
    const validImages = images.filter((image) => Boolean(image?.trim()));

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
