'use client';

import { useState, useEffect } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaFilePdf, FaFileImage, FaFileCode, FaFileCsv, FaTerminal, FaEllipsisV, FaDownload } from 'react-icons/fa';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    lastModified?: string;
}

interface FileExplorerProps {
    onFileSelect: (file: FileItem) => void;
    selectedPath?: string | null;
}

export default function FileExplorer({ onFileSelect, selectedPath }: FileExplorerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentPath = searchParams.get('prefix') || '';
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchItems = async (prefix: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/s3-list?prefix=${encodeURIComponent(prefix)}`);
            const data = await response.json();
            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(currentPath);
    }, [currentPath]);

    const handleFolderClick = (path: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('prefix', path);
        // Keep the selected file if it's in the new folder? No, usually deselect or keep as is.
        // But if we change folder, the file might not be visible.
        // Let's just update prefix.
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleBack = () => {
        if (!currentPath) return;

        // Remove trailing slash if exists
        const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        const parts = cleanPath.split('/');
        parts.pop(); // Remove last segment
        const newPath = parts.join('/');
        const finalPath = newPath ? (newPath.endsWith('/') ? newPath : newPath + '/') : '';

        const params = new URLSearchParams(searchParams);
        if (finalPath) {
            params.set('prefix', finalPath);
        } else {
            params.delete('prefix');
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleDownloadFolder = async (e: React.MouseEvent, path: string) => {
        e.stopPropagation(); // Prevent folder navigation
        window.location.href = `/api/s3-zip?prefix=${encodeURIComponent(path)}`;
    };

    const getIcon = (item: FileItem) => {
        if (item.type === 'folder') return <FaFolder className="text-yellow-500" />;
        if (item.name.endsWith('.pdf')) return <FaFilePdf className="text-red-500" />;
        if (item.name.match(/\.(jpg|jpeg|png|gif)$/i)) return <FaFileImage className="text-blue-500" />;
        if (item.name.match(/\.(js|ts|json|css|html|txt|md)$/i)) return <FaFileCode className="text-green-500" />;
        if (item.name.endsWith('.csv')) return <FaFileCsv className="text-green-600" />;
        if (item.name.endsWith('.sh')) return <FaTerminal className="text-gray-700 dark:text-gray-300" />;
        return <FaFile className="text-gray-500" />;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    disabled={!currentPath}
                >
                    Back
                </Button>
                <span className="text-sm font-medium truncate flex-1">
                    {currentPath || 'Root'}
                </span>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-1">
                            {items.map((item) => (
                                <div
                                    key={item.path}
                                    className={cn(
                                        "group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                        selectedPath === item.path && "bg-blue-100 dark:bg-blue-900"
                                    )}
                                    onClick={() => item.type === 'folder' ? handleFolderClick(item.path) : onFileSelect(item)}
                                >
                                    {getIcon(item)}
                                    <span className="text-sm truncate flex-1">{item.name}</span>
                                    {item.size && (
                                        <span className="text-xs text-gray-400">
                                            {(item.size / 1024).toFixed(1)} KB
                                        </span>
                                    )}

                                    {item.type === 'folder' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FaEllipsisV className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => handleDownloadFolder(e, item.path)}>
                                                    <FaDownload className="mr-2 h-4 w-4" /> Download Folder
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Empty folder
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
