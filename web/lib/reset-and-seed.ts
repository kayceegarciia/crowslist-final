import bcrypt from "bcryptjs";
import { PostCategory, Role, type PrismaClient } from "@prisma/client";

type ResetAndSeedOptions = {
  userCount?: number;
  postCount?: number;
  forceApproved?: boolean;
};

type ResetAndSeedResult = {
  deletedPosts: number;
  deletedFeedback: number;
  deletedPostNotifications: number;
  createdUsers: number;
  updatedUsers: number;
  createdPosts: number;
  userCount: number;
  postCount: number;
};

const FIRST_NAMES = [
  "Ava",
  "Noah",
  "Mia",
  "Liam",
  "Sophia",
  "Ethan",
  "Emma",
  "Mason",
  "Olivia",
  "Lucas",
  "Amelia",
  "Elijah",
  "Harper",
  "James",
  "Isla",
  "Benjamin",
  "Aria",
  "Logan",
  "Ella",
  "Daniel",
];

const LAST_NAMES = [
  "Carter",
  "Nguyen",
  "Patel",
  "Kim",
  "Rivera",
  "Brooks",
  "Reyes",
  "Collins",
  "Stewart",
  "Foster",
  "Ward",
  "Diaz",
  "Morris",
  "Bailey",
  "Price",
  "Hughes",
  "Griffin",
  "Simmons",
  "Long",
  "Perry",
];

const COLLEGES = ["Tempe", "West", "Poly", "Downtown", "Online"] as const;

const CATEGORY_DATA: Record<
  PostCategory,
  { titles: string[]; descriptions: string[] }
> = {
  NOTES: {
    titles: [
      "BIO 181 Midterm Notes",
      "CHEM 113 Lab Summary",
      "MAT 265 Formula Sheet",
      "CSE 110 Study Guide",
      "PSY 101 Lecture Notes",
    ],
    descriptions: [
      "Clean notes with color coding and chapter references.",
      "Summaries for key units and exam-focused highlights.",
      "Weekly notes with diagrams and practice questions.",
    ],
  },
  BOOKS: {
    titles: [
      "Calculus Early Transcendentals",
      "Organic Chemistry Textbook",
      "College Physics Workbook",
      "Technical Writing Handbook",
      "Intro to Sociology Reader",
    ],
    descriptions: [
      "Used lightly, no missing pages, great condition.",
      "Includes margin notes and chapter bookmarks.",
      "Perfect for semester prep with solved examples.",
    ],
  },
  EQUIPMENT: {
    titles: [
      "Dorm Mini Fridge",
      "Adjustable Desk Lamp",
      "Folding Whiteboard",
      "Graphing Calculator",
      "Noise-Canceling Study Booth Fan",
    ],
    descriptions: [
      "Works perfectly and ideal for dorm life.",
      "Reliable item for daily campus use.",
      "Selling due to graduation, well maintained.",
    ],
  },
  ELECTRONICS: {
    titles: [
      "iPad for Note Taking",
      "Wireless Keyboard",
      "USB-C Monitor Hub",
      "Bluetooth Headphones",
      "Webcam 1080p",
    ],
    descriptions: [
      "Battery health is solid and all accessories included.",
      "Great for remote classes and assignment work.",
      "No defects, tested recently and fully functional.",
    ],
  },
  FURNITURE: {
    titles: [
      "Study Desk with Storage",
      "Ergonomic Chair",
      "Twin Bed Frame",
      "Bookshelf 5-Tier",
      "Rolling Utility Cart",
    ],
    descriptions: [
      "Fits small spaces and easy to assemble.",
      "Great condition with minor cosmetic wear.",
      "Ideal for apartment or on-campus housing.",
    ],
  },
};

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1488998527040-85054a85150e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1200&q=80",
];

const DEFAULT_OPTIONS: Required<ResetAndSeedOptions> = {
  userCount: 10,
  postCount: 30,
  forceApproved: true,
};

const DEFAULT_PASSWORD = "AsuSeed@1";

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function buildFakeUsers(count: number, hashedPassword: string) {
  return Array.from({ length: count }, (_, idx) => {
    const first = FIRST_NAMES[idx % FIRST_NAMES.length] as string;
    const last = LAST_NAMES[Math.floor(idx / FIRST_NAMES.length) % LAST_NAMES.length] as string;
    const serial = String(idx + 1).padStart(2, "0");
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${serial}@asu.edu`;

    return {
      name: `${first} ${last}`,
      email,
      password: hashedPassword,
      college: COLLEGES[idx % COLLEGES.length] as string,
      phoneNo: `480555${String(1000 + idx).slice(-4)}`,
      image: `https://i.pravatar.cc/300?img=${(idx % 70) + 1}`,
      role: Role.USER,
    };
  });
}

function buildFakePosts(
  sellerIds: string[],
  count: number,
  forceApproved: boolean
) {
  const categories = Object.values(PostCategory) as PostCategory[];

  return Array.from({ length: count }, (_, idx) => {
    const category = categories[idx % categories.length] as PostCategory;
    const categoryMeta = CATEGORY_DATA[category];
    const title = `${pickRandom(categoryMeta.titles)} ${idx + 1}`;
    const description = pickRandom(categoryMeta.descriptions);
    const price = String(10 + Math.floor(Math.random() * 240));
    const imageCount = 1 + Math.floor(Math.random() * 4);

    return {
      title,
      description,
      price,
      category,
      images: IMAGE_POOL.slice(0, imageCount),
      sellerId: sellerIds[idx % sellerIds.length] as string,
      isAvailable: true,
      isApproved: forceApproved,
    };
  });
}

export async function resetAndSeedMarketplaceData(
  prisma: PrismaClient,
  options?: ResetAndSeedOptions
): Promise<ResetAndSeedResult> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const existingPostIds = await prisma.post.findMany({
    select: { id: true },
  });

  const postIds = existingPostIds.map((post) => post.id);

  const deletedFeedback = postIds.length
    ? (
        await prisma.feedback.deleteMany({
          where: {
            postId: { in: postIds },
          },
        })
      ).count
    : 0;

  const deletedPostNotifications = (
    await prisma.notification.deleteMany({
      where: {
        targetType: "POST",
      },
    })
  ).count;

  const deletedPosts = (await prisma.post.deleteMany({})).count;

  const fakeUsers = buildFakeUsers(mergedOptions.userCount, hashedPassword);

  let createdUsers = 0;
  let updatedUsers = 0;

  for (const user of fakeUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (existing) {
      updatedUsers += 1;
    } else {
      createdUsers += 1;
    }

    await prisma.user.upsert({
      where: { email: user.email },
      create: user,
      update: {
        name: user.name,
        password: user.password,
        college: user.college,
        phoneNo: user.phoneNo,
        image: user.image,
      },
    });
  }

  const seededUsers = await prisma.user.findMany({
    where: {
      email: {
        in: fakeUsers.map((user) => user.email),
      },
    },
    select: {
      id: true,
    },
  });

  const sellerIds = seededUsers.map((user) => user.id);

  if (!sellerIds.length) {
    throw new Error("No users were available for seeded post creation");
  }

  const fakePosts = buildFakePosts(
    sellerIds,
    mergedOptions.postCount,
    mergedOptions.forceApproved
  );

  const createdPosts = (await prisma.post.createMany({ data: fakePosts })).count;

  return {
    deletedPosts,
    deletedFeedback,
    deletedPostNotifications,
    createdUsers,
    updatedUsers,
    createdPosts,
    userCount: mergedOptions.userCount,
    postCount: mergedOptions.postCount,
  };
}
