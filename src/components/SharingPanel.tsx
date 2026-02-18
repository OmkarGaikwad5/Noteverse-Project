"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/custom/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function SharingPanel({ noteId }: { noteId: string }) {
    const { user } = useAuth();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view'|'edit'>('edit');
    type SharedEntry = {
        userId: { _id?: string; email?: string } | string;
        permission: 'view' | 'edit';
        sharedAt?: string | Date;
    };

    const [list, setList] = useState<SharedEntry[]>([]);
    type InviteEntry = {
        token: string;
        noteId: string;
        inviterId?: string;
        email: string;
        permission: 'view' | 'edit';
        message?: string;
        accepted?: boolean;
        acceptedBy?: string;
        createdAt: string;
    };
    const [invites, setInvites] = useState<InviteEntry[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [shareLink, setShareLink] = useState<string | null>(null);
    type AuditEntry = {
        _id?: string;
        noteId?: string;
        action: string;
        userId?: string;
        details?: Record<string, unknown> | null;
        createdAt: string;
    };
    const [audit, setAudit] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            const res = await fetch(`/api/notes/${noteId}/share`);
            if (!res.ok) return;
            const data = await res.json();
            setList((data.sharedWith || []) as SharedEntry[]);
        } catch (e) {
            console.error(e);
            toast.error({ title: "Failed to load sharing list", description: "Please try again." });
        }
    }, [noteId, toast]);

    const fetchInvites = useCallback(async () => {
        try {
            const res = await fetch(`/api/notes/${noteId}/invite`);
            if (!res.ok) return;
            const data = await res.json();
            setInvites(data.invites || []);
        } catch (e) {
            console.error(e);
            toast.error({ title: "Failed to load invites", description: "Please try again." });
        }
    }, [noteId, toast]);

    const fetchAudit = useCallback(async () => {
        try {
            const res = await fetch(`/api/notes/${noteId}/audit`);
            if (!res.ok) return;
            const data = await res.json();
            setAudit(data.logs || []);
        } catch (e) {
            console.error(e);
            toast.error({ title: "Failed to load activity", description: "Please try again." });
        }
    }, [noteId, toast]);

    useEffect(() => { fetchList(); }, [fetchList]);
    useEffect(() => { fetchInvites(); fetchAudit(); }, [fetchInvites, fetchAudit]);

    const handleShare = async () => {
        if (!email) {
            toast.info({ title: "Email required", description: "Enter an email to share with." });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/notes/${noteId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, permission }) });
            if (!res.ok) {
                toast.error({ title: "Share failed", description: "Could not share this note." });
                return;
            }
            setEmail('');
            await fetchList();
            await fetchAudit();
            toast.success({ title: "Note shared", description: `Shared with ${email}.` });
        } finally {
            setLoading(false);
        }
    };

    const handleUnshare = async (eMail: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/notes/${noteId}/share`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: eMail }) });
            if (!res.ok) {
                toast.error({ title: "Remove failed", description: "Could not remove collaborator." });
                return;
            }
            await fetchList();
            await fetchAudit();
            toast.success({ title: "Access removed", description: `${eMail} no longer has access.` });
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) {
            toast.info({ title: "Email required", description: "Enter an email to send invite." });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/notes/${noteId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, permission, message: inviteMessage, createLink: true }) });
            if (res.ok) {
                const data = await res.json();
                setShareLink(data.invite?.link || data.link || null);
                setInviteEmail('');
                setInviteMessage('');
                await fetchInvites();
                await fetchAudit();
                toast.success({ title: "Invite sent", description: `Invitation sent to ${inviteEmail}.` });
            } else {
                toast.error({ title: "Invite failed", description: "Could not create invite." });
            }
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        if (!shareLink) return;
        try {
            await navigator.clipboard.writeText(shareLink);
            toast.success({ title: "Link copied", description: "Share link copied to clipboard." });
        } catch (e) {
            console.error(e);
            toast.error({ title: "Copy failed", description: "Could not copy invite link." });
        }
    };

    return (
        <div className="w-full max-w-lg p-3 bg-surface/90 rounded-lg border border-border">
            <h4 className="font-semibold mb-2">Share & Collaboration</h4>
            <div className="flex gap-2">
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email to share" className="flex-1 input" />
                <select value={permission} onChange={e => setPermission(e.target.value as 'view' | 'edit')} className="select">
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                </select>
                <Button onClick={handleShare} variant="primary" className="px-3">{loading ? '...' : 'Share'}</Button>
            </div>
            <div className="mt-3 border-t pt-3">
                <h5 className="text-sm mb-1">Invite by email / Share link</h5>
                <div className="flex gap-2">
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Invitee email" className="flex-1 input" />
                    <Button onClick={handleInvite} variant="secondary" className="px-3">{loading ? '...' : 'Invite'}</Button>
                </div>
                <textarea value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="Optional message" className="mt-2 input h-20" />
                {shareLink && (
                    <div className="mt-2 flex items-center gap-2">
                        <input readOnly value={shareLink} className="flex-1 input" />
                        <Button onClick={copyLink} variant="ghost">Copy</Button>
                    </div>
                )}
            </div>
            <div className="mt-3">
                <h5 className="text-sm mb-1">Shared With</h5>
                <ul className="space-y-1">
                    {list.map((s) => (
                        <li key={String(typeof s.userId === 'string' ? s.userId : s.userId?._id || s.userId)} className="flex justify-between items-center">
                            <div className="text-sm">{typeof s.userId === 'string' ? s.userId : (s.userId?.email || s.userId?._id || 'Unknown')} — <span className="text-xs">{s.permission}</span></div>
                            {user?.email === (typeof s.userId === 'string' ? s.userId : s.userId?.email) ? null : (
                                <Button onClick={() => handleUnshare(typeof s.userId === 'string' ? s.userId : s.userId?.email || '')} variant="ghost" size="sm">Remove</Button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-3 border-t pt-3">
                <h5 className="text-sm mb-1">Pending Invites</h5>
                <ul className="space-y-1">
                    {invites.map((inv: InviteEntry) => (
                        <li key={inv.token} className="flex justify-between items-center text-sm">
                            <div>
                                <div className="font-medium">{inv.email}</div>
                                <div className="text-xs text-muted">{inv.permission} • {new Date(inv.createdAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <a href={inviteLink(inv.token)} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Open</a>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-3 border-t pt-3">
                <h5 className="text-sm mb-1">Activity</h5>
                <ul className="space-y-1 text-xs text-gray-600 max-h-48 overflow-auto">
                    {audit.map((a: AuditEntry) => (
                        <li key={String(a._id)}>
                            <div className="font-medium">{a.action}</div>
                            <div className="text-xs">{a.details ? JSON.stringify(a.details) : ''} • {new Date(a.createdAt).toLocaleString()}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function inviteLink(token: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '');
    return `${base}/api/invite/${token}`;
}
