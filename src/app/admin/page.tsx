'use client';

import Link from 'next/link';
import { FaUsers, FaCog, FaChartBar, FaFolder } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface AdminCard {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

export default function AdminPage() {
    const adminSections: AdminCard[] = [
        {
            title: 'User Management',
            description: 'Manage users, roles, and permissions. Create, edit, or delete user accounts.',
            icon: <FaUsers className="h-8 w-8" />,
            href: '/admin/users',
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: 'System Settings',
            description: 'Configure system-wide settings and preferences.',
            icon: <FaCog className="h-8 w-8" />,
            href: '/admin/settings',
            color: 'from-purple-500 to-purple-600',
        },
        {
            title: 'Analytics',
            description: 'View system analytics, usage statistics, and reports.',
            icon: <FaChartBar className="h-8 w-8" />,
            href: '/admin/analytics',
            color: 'from-green-500 to-green-600',
        },
        {
            title: 'File Management',
            description: 'Manage S3 buckets, folders, and file permissions.',
            icon: <FaFolder className="h-8 w-8" />,
            href: '/admin/files',
            color: 'from-orange-500 to-orange-600',
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome to the administration panel. Manage your system from here.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Total Users</div>
                        <div className="text-3xl font-bold">-</div>
                    </div>
                    <div className="bg-card border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Active Sessions</div>
                        <div className="text-3xl font-bold">-</div>
                    </div>
                    <div className="bg-card border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Storage Used</div>
                        <div className="text-3xl font-bold">-</div>
                    </div>
                    <div className="bg-card border rounded-lg p-6">
                        <div className="text-sm text-muted-foreground mb-1">Files</div>
                        <div className="text-3xl font-bold">-</div>
                    </div>
                </div>

                {/* Admin Sections */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Administration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {adminSections.map((section) => (
                            <Link key={section.href} href={section.href}>
                                <div className="group bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                                    <div className={`bg-gradient-to-r ${section.color} p-6 text-white`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {section.icon}
                                                <h3 className="text-xl font-bold">{section.title}</h3>
                                            </div>
                                            <svg
                                                className="h-6 w-6 transform group-hover:translate-x-1 transition-transform"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/admin/users">
                            <Button>
                                <FaUsers className="mr-2 h-4 w-4" />
                                Add New User
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline">
                                <FaFolder className="mr-2 h-4 w-4" />
                                Go to File Explorer
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
