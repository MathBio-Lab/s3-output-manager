'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaTrashRestore, FaEye, FaEyeSlash } from 'react-icons/fa';

interface User {
    id: number;
    username: string;
    prefix: string | null;
    type: 'admin' | 'client' | 'team';
    metadata: unknown;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [prefix, setPrefix] = useState('');
    const [type, setType] = useState<'admin' | 'client' | 'team'>('client');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, prefix, type }),
            });

            if (res.ok) {
                setIsOpen(false);
                resetForm();
                fetchUsers();
                alert(editingUser ? 'User updated successfully' : 'User created successfully');
            } else {
                alert('Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
                fetchUsers();
                alert(data.message || 'User deleted successfully');
            } else {
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user', error);
            alert('An error occurred while deleting the user');
        }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setUsername(user.username);
        setPassword(''); // Don't show password
        setPrefix(user.prefix || '');
        setType(user.type);
        setIsOpen(true);
    };

    const resetForm = () => {
        setEditingUser(null);
        setUsername('');
        setPassword('');
        setShowPassword(false);
        setPrefix('');
        setType('client');
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-4">
                <Link href="/admin">
                    <Button variant="ghost" size="sm">
                        <FaArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Users Management</h1>
                <div className="flex gap-2">
                    <Link href="/admin/users/deleted">
                        <Button variant="outline">
                            <FaTrashRestore className="mr-2" /> Deleted Users
                        </Button>
                    </Link>
                    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                        <SheetTrigger asChild>
                            <Button onClick={resetForm}><FaPlus className="mr-2" /> Add User</Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{editingUser ? 'Edit User' : 'Add New User'}</SheetTitle>
                                <SheetDescription>
                                    {editingUser ? 'Update user details.' : 'Create a new user for the system.'}
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Username</label>
                                    <Input value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required={!editingUser}
                                            placeholder={editingUser ? 'Leave blank to keep unchanged' : ''}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                {type !== 'admin' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Prefix (S3 Folder)</label>
                                        <Input
                                            value={prefix}
                                            onChange={e => setPrefix(e.target.value)}
                                            required
                                            placeholder="e.g., client-folder"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This user will only have access to files within this folder
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Access Level</label>
                                        <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                                            <span className="text-muted-foreground">Full bucket access (no prefix restriction)</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Admin users have access to all files in the bucket
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={type}
                                        onChange={e => {
                                            const newType = e.target.value as 'admin' | 'client' | 'team';
                                            setType(newType);
                                            if (newType === 'admin') setPrefix('');
                                        }}
                                    >
                                        <option value="client">Client</option>
                                        <option value="team">Team</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <SheetFooter>
                                    <Button type="submit">{editingUser ? 'Update' : 'Create'}</Button>
                                </SheetFooter>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Username</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Prefix</th>
                            <th className="px-6 py-3">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center">No users found</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="bg-background hover:bg-muted/50">
                                    <td className="px-6 py-4 font-medium">{user.id}</td>
                                    <td className="px-6 py-4">{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.type === 'admin' ? 'bg-red-100 text-red-800' :
                                            user.type === 'team' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {user.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{user.prefix || '-'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                            <FaEdit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(user.id)}>
                                            <FaTrash className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
