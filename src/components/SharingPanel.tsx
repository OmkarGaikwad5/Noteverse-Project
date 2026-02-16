"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/custom/button';
import { useAuth } from '@/context/AuthContext';

export default function SharingPanel({ noteId }: { noteId: string }) {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view'|'edit'>('edit');
    type SharedEntry = {
        userId: { _id?: string; email?: string } | string;
        permission: 'view' | 'edit';
        sharedAt?: string | Date;
    };

    const [list, setList] = useState<SharedEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            const res = await fetch(`/api/notes/${noteId}/share`);
            if (!res.ok) return;
            const data = await res.json();
            setList((data.sharedWith || []) as SharedEntry[]);
        } catch (e) { console.error(e); }
    }, [noteId]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const handleShare = async () => {
        if (!email) return;
        setLoading(true);
        await fetch(`/api/notes/${noteId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, permission }) });
        setEmail('');
        await fetchList();
        setLoading(false);
    };

    const handleUnshare = async (eMail: string) => {
        setLoading(true);
        await fetch(`/api/notes/${noteId}/share`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: eMail }) });
        await fetchList();
        setLoading(false);
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
        </div>
    );
}
