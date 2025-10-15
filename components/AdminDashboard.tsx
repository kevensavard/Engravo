"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  CreditCard,
  Search,
  Edit,
  Trash2,
  Shield,
  BarChart3,
  RefreshCw,
  Star,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Analytics {
  overview: {
    totalUsers: number;
    newUsersThisMonth: number;
    totalCredits: number;
    mrr: string;
    transactionsThisMonth: number;
  };
  subscriptions: {
    byTier: { tier: string; count: number }[];
    mrr: string;
  };
  credits: {
    totalDistributed: number;
    totalAdded: number;
    totalUsed: number;
    remaining: number;
  };
  features: {
    usage: { feature: string; count: number; totalCredits: number }[];
  };
  recentActivity: any[];
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  credits: number;
  subscriptionTier: string;
  subscriptionStatus: string;
  isAdmin: boolean;
  createdAt: Date;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editCredits, setEditCredits] = useState(0);
  const [editTier, setEditTier] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users?page=${currentPage}&limit=20&search=${searchTerm}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credits: editCredits,
          subscriptionTier: editTier,
        }),
      });

      if (response.ok) {
        alert("User updated successfully!");
        setEditingUser(false);
        setSelectedUser(null);
        fetchUsers();
        fetchAnalytics();
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Update user error:", error);
      alert("Failed to update user");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditCredits(user.credits);
    setEditTier(user.subscriptionTier);
    setEditingUser(true);
  };

  if (!analytics && loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fetchAnalytics()}
                variant="outline"
                className="flex items-center gap-2 border-gray-600 text-white hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2 border-gray-600 text-white hover:bg-gray-700">
                  <ArrowLeft className="w-4 h-4" />
                  Back to App
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "users"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              User Management
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && analytics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-200" />
                  <span className="text-blue-200 text-sm">Total</span>
                </div>
                <div className="text-3xl font-bold">{analytics.overview.totalUsers}</div>
                <div className="text-blue-200 text-sm mt-1">Users</div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-200" />
                  <span className="text-green-200 text-sm">30 Days</span>
                </div>
                <div className="text-3xl font-bold">{analytics.overview.newUsersThisMonth}</div>
                <div className="text-green-200 text-sm mt-1">New Users</div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-purple-200" />
                  <span className="text-purple-200 text-sm">Monthly</span>
                </div>
                <div className="text-3xl font-bold">${analytics.overview.mrr}</div>
                <div className="text-purple-200 text-sm mt-1">MRR</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 text-yellow-200" />
                  <span className="text-yellow-200 text-sm">Total</span>
                </div>
                <div className="text-3xl font-bold">{analytics.credits.totalDistributed.toLocaleString()}</div>
                <div className="text-yellow-200 text-sm mt-1">Credits</div>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-red-200" />
                  <span className="text-red-200 text-sm">30 Days</span>
                </div>
                <div className="text-3xl font-bold">{analytics.overview.transactionsThisMonth}</div>
                <div className="text-red-200 text-sm mt-1">Transactions</div>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  Subscriptions by Tier
                </h2>
                <div className="space-y-3">
                  {analytics.subscriptions.byTier.map((tier) => (
                    <div
                      key={tier.tier}
                      className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
                    >
                      <span className="font-semibold capitalize">{tier.tier}</span>
                      <span className="text-2xl font-bold text-blue-400">{tier.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  Credit Statistics
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                    <span className="text-gray-300">Total Added</span>
                    <span className="text-2xl font-bold text-green-400">
                      {analytics.credits.totalAdded.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                    <span className="text-gray-300">Total Used</span>
                    <span className="text-2xl font-bold text-red-400">
                      {analytics.credits.totalUsed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                    <span className="text-gray-300">Currently Distributed</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {analytics.credits.totalDistributed.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Usage */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-purple-400" />
                Feature Usage Statistics
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Times Used</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Credits Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.features.usage
                      .filter((f) => f.feature)
                      .sort((a, b) => (b.count || 0) - (a.count || 0))
                      .map((feature, index) => (
                        <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 px-4 capitalize">{feature.feature?.replace(/([A-Z])/g, ' $1').trim()}</td>
                          <td className="py-3 px-4 text-right font-semibold">{feature.count}</td>
                          <td className="py-3 px-4 text-right font-semibold text-yellow-400">
                            {feature.totalCredits}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-green-400" />
                Recent Activity
              </h2>
              <div className="space-y-2">
                {analytics.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 text-sm"
                  >
                    <div className="flex-1">
                      <span className="text-gray-400">{activity.userId.substring(0, 12)}...</span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-300">{activity.description}</span>
                    </div>
                    <span
                      className={`font-bold ${
                        activity.amount > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {activity.amount > 0 ? "+" : ""}
                      {activity.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={() => fetchUsers()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left py-4 px-4 text-gray-300 font-semibold">User</th>
                      <th className="text-left py-4 px-4 text-gray-300 font-semibold">Email</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Credits</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Tier</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Status</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Admin</th>
                      <th className="text-right py-4 px-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                    : "No Name"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {user.id.substring(0, 12)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-300">{user.email}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full font-semibold">
                              {user.credits}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full font-semibold capitalize ${
                                user.subscriptionTier === "master"
                                  ? "bg-orange-600/20 text-orange-400"
                                  : user.subscriptionTier === "pro"
                                  ? "bg-purple-600/20 text-purple-400"
                                  : user.subscriptionTier === "starter"
                                  ? "bg-blue-600/20 text-blue-400"
                                  : "bg-gray-600/20 text-gray-400"
                              }`}
                            >
                              {user.subscriptionTier}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full font-semibold capitalize ${
                                user.subscriptionStatus === "active"
                                  ? "bg-green-600/20 text-green-400"
                                  : "bg-red-600/20 text-red-400"
                              }`}
                            >
                              {user.subscriptionStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {user.isAdmin && (
                              <Shield className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => openEditModal(user)}
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-700">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-gray-600"
                  >
                    Previous
                  </Button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="border-gray-600"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="w-6 h-6 text-blue-400" />
              Edit User: {selectedUser.email}
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Credits</Label>
                <Input
                  type="number"
                  value={editCredits}
                  onChange={(e) => setEditCredits(Number(e.target.value))}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  min="0"
                />
              </div>

              <div>
                <Label className="text-gray-300">Subscription Tier</Label>
                <Select value={editTier} onValueChange={setEditTier}>
                  <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <strong>Current:</strong> {selectedUser.credits} credits, {selectedUser.subscriptionTier} tier
                </p>
                <p className="text-sm text-blue-300 mt-1">
                  <strong>New:</strong> {editCredits} credits, {editTier} tier
                </p>
                {editCredits !== selectedUser.credits && (
                  <p className="text-sm text-yellow-300 mt-2">
                    ⚠️ Credits change: {editCredits > selectedUser.credits ? "+" : ""}
                    {editCredits - selectedUser.credits}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setEditingUser(false);
                    setSelectedUser(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

