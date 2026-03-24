import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import type { IPost, IUserRequest } from "@/actions/types";
import { DashboardTable } from "../../../../components/admin-dashboard-table";
import { adminHome } from "../../../../actions/admin";
import { AdminSeedControls } from "@/components/admin-seed-controls";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboard() {
  const { posts, requests } = (await adminHome()) as unknown as {
    posts: IPost[];
    requests: IUserRequest[];
  };

  return (
    <div className="space-y-5">
      <AdminSeedControls />

      <div className="space-y-2">
        <h1 className="text-xl font-bold">(Pending Approval) Product Posts</h1>
        <DashboardTable type="post" posts={posts} />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold">
          (Pending Approval) Product Requests
        </h1>
        <DashboardTable type="request" requests={requests} />
      </div>
    </div>
  );
}
