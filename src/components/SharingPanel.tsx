"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/custom/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { FaUserPlus, FaTrash, FaEnvelope, FaCheck, FaClock, FaUser } from "react-icons/fa";

interface ShareItem {
  id?: string;
  email: string;
  name?: string;
  permission: 'view' | 'edit';
  type: 'user' | 'invite';
  sharedAt?: string;
  createdAt?: string;
  expiresAt?: string;
  invitedBy?: string;
  invitedByName?: string;
}

export default function SharingPanel({ noteId }: { noteId: string }) {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("edit");
  const [sharedItems, setSharedItems] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "invites">("all");
  const [refreshKey, setRefreshKey] = useState(0);

  /* ============================== */
  /* FETCH SHARED USERS & INVITES   */
  /* ============================== */
  const fetchSharedItems = useCallback(async () => {
    try {
      console.log("Fetching shared items for note:", noteId);
      const res = await fetch(`/api/notes/${noteId}/share`);

      if (!res.ok) {
        console.error("Failed to fetch shares:", res.status);
        return;
      }

      const data = await res.json();
      console.log("Fetched shared items:", data);
      setSharedItems(data.sharedWith || []);
    } catch (err) {
      console.error("Error fetching shared items:", err);
      error({
        title: "Failed to load sharing list",
      });
    }
  }, [noteId, error]);

  useEffect(() => {
    if (!noteId) return;
    fetchSharedItems();
  }, [noteId, fetchSharedItems, refreshKey]);

  /* ============================== */
  /* SHARE NOTE - Works with ANY email */
  /* ============================== */
  const handleShare = async () => {
    if (!noteId) return;

    if (!email) {
      info({
        title: "Email required",
        description: "Enter an email address to share with.",
      });
      return;
    }

    if (email === user?.email) {
      info({
        title: "Invalid email",
        description: "You already own this note.",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("Sharing note with:", email, permission);
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          permission,
        }),
      });

      const data = await res.json();
      console.log("Share response:", data);

      if (!res.ok) {
        error({
          title: "Share failed",
          description: data.error || "Unable to share note.",
        });
        return;
      }

      setEmail("");

      // Refresh the list immediately
      await fetchSharedItems();
      
      // Force a re-render
      setRefreshKey(prev => prev + 1);

      if (data.userExists) {
        success({
          title: "Note shared!",
          description: data.message || `Note shared with ${email}`,
        });
      } else {
        success({
          title: "Invitation sent!",
          description: data.message || `Invitation sent to ${email}`,
        });
      }
    } catch (err) {
      console.error("Share error:", err);
      error({
        title: "Share failed",
        description: "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ============================== */
  /* REMOVE ACCESS                  */
  /* ============================== */
  const handleRemove = async (item: ShareItem) => {
    setLoading(true);

    try {
      console.log("Removing access for:", item.email, item.type);
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: item.email,
          type: item.type 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        error({
          title: "Remove failed",
          description: data.error || "Could not remove access",
        });
        return;
      }

      // Refresh the list immediately
      await fetchSharedItems();
      setRefreshKey(prev => prev + 1);

      success({
        title: "Access removed",
        description: data.message,
      });
    } catch (err) {
      console.error("Remove error:", err);
      error({
        title: "Remove failed",
        description: "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ============================== */
  /* FILTER ITEMS                   */
  /* ============================== */
  const filteredItems = sharedItems.filter(item => {
    if (activeTab === "users") return item.type === 'user';
    if (activeTab === "invites") return item.type === 'invite';
    return true;
  });

  /* ============================== */
  /* UI                             */
  /* ============================== */
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg">Share Note</h4>
      
      <p className="text-sm text-gray-600">
        Share this note with anyone by email. They'll receive an email with access instructions.
      </p>

      {/* Share Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter any email address"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={permission}
            onChange={(e) =>
              setPermission(e.target.value as "view" | "edit")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="view">Can view</option>
            <option value="edit">Can edit</option>
          </select>

          <Button
            onClick={handleShare}
            variant="primary"
            className="px-4 bg-blue-600 hover:bg-blue-700 gap-2"
            disabled={loading}
          >
            <FaUserPlus className="text-sm" />
            {loading ? "..." : "Share"}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          💡 Users without an account will receive an invitation email to create one.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({sharedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Users ({sharedItems.filter(i => i.type === 'user').length})
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "invites"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Invites ({sharedItems.filter(i => i.type === 'invite').length})
        </button>
      </div>

      {/* Shared Items List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaEnvelope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No one has access yet</p>
            <p className="text-sm">Share this note with anyone by email</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id || item.email}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900">
                    {item.type === 'invite' && <FaEnvelope className="inline text-yellow-500 mr-2 text-sm" />}
                    {item.type === 'user' && <FaCheck className="inline text-green-500 mr-2 text-sm" />}
                    {item.name || item.email}
                  </div>
                  {item.type === 'invite' && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                  {item.type === 'user' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                
                {item.type === 'user' && item.name && (
                  <div className="text-sm text-gray-500">{item.email}</div>
                )}
                
                <div className="text-xs text-gray-400 mt-1">
                  Permission: {item.permission === "edit" ? "Can edit" : "Can view"}
                  {item.type === 'invite' && item.expiresAt && (
                    <span className="ml-2">
                      • Expires: {new Date(item.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {item.type === 'invite' && item.invitedBy && (
                    <span className="ml-2">
                      • Invited by {item.invitedByName || item.invitedBy}
                    </span>
                  )}
                  {item.type === 'user' && item.sharedAt && (
                    <span className="ml-2">
                      • Shared {new Date(item.sharedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {user?.email !== item.email && (
                <Button
                  onClick={() => handleRemove(item)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title={item.type === 'invite' ? "Cancel invitation" : "Remove access"}
                >
                  <FaTrash />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <FaEnvelope className="text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How sharing works:</p>
            <ul className="space-y-1 text-xs">
              <li>✓ Share with ANY email address - no account needed</li>
              <li>✓ Existing users get immediate access and show as "Active"</li>
              <li>✓ New users receive an email invitation and show as "Pending" until they accept</li>
              <li>✓ Recipients receive an email with a secure invitation link</li>
              <li>✓ Invitations expire after 7 days for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}