'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaUndo, FaTrashRestore } from 'react-icons/fa';

interface DeletedUser {
    id: number;
    username: string;
    prefix: string | null;
    type: 'admin' | 'client' | 'team';
    metadata: unknown;
    createdAt: string;
    deletedAt: string;
}

export default function DeletedUsersPage() {
    const [users, setUsers] = useState<DeletedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDeletedUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/deleted');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch deleted users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedUsers();
    }, []);

    const handleRestore = async (id: number, username: string) => {
        if (!confirm(`Are you sure you want to restore user "${username}"?`)) return;

        try {
            const res = await fetch(`/api/users/${id}/restore`, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                fetchDeletedUsers();
                alert(data.message || 'User restored successfully');
            } else {
                alert(data.error || 'Failed to restore user');
            }
        } catch (error) {
            console.error('Error restoring user', error);
            alert('An error occurred while restoring the user');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="sm">
                        <FaArrowLeft className="mr-2 h-4 w-4" />
                        Back to Active Users
                    </Button>
                </Link>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Deleted Users</h1>
                    <p className="text-muted-foreground mt-1">
                        View and restore users that have been deleted
                    </p>
                </div>
            </div>

            {users.length === 0 && !loading && (
                <div className="bg-card border rounded-lg p-12 text-center">
                    <FaTrashRestore className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Deleted Users</h3>
                    <p className="text-muted-foreground">
                        All users are active. Deleted users will appear here.
                    </p>
                </div>
            )}

            {(users.length > 0 || loading) && (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground uppercase">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Username</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Prefix</th>
                                <th className="px-6 py-3">Deleted At</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="bg-background hover:bg-muted/50">
                                        <td className="px-6 py-4 font-medium">{user.id}</td>
                                        <td className="px-6 py-4 line-through text-muted-foreground">{user.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold opacity-60 ${user.type === 'admin' ? 'bg-red-100 text-red-800' :
                                                    user.type === 'team' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {user.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                            {user.prefix || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(user.deletedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleRestore(user.id, user.username)}
                                            >
                                                <FaUndo className="mr-2 h-3 w-3" />
                                                Restore
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
