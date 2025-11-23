'use client';

import { useState, useEffect } from 'react';
import { FaFile, FaFolder, FaDownload, FaTrash, FaUpload, FaArrowLeft, FaFilePdf, FaFileImage, FaFileCode, FaFileCsv, FaTerminal, FaEllipsisV } from 'react-icons/fa';

interface FileSystemEntry {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
    file: (callback: (file: File) => void) => void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader: () => FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
    readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
}
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
    rootPrefix?: string;
}

export default function FileExplorer({ onFileSelect, selectedPath, rootPrefix = '' }: FileExplorerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(rootPrefix);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [isDragging, setIsDragging] = useState(false);

    // Sync currentPath with URL or rootPrefix
    useEffect(() => {
        const pathParam = searchParams.get('prefix'); // Changed from 'path' to 'prefix' to match existing usage
        if (pathParam) {
            if (pathParam.startsWith(rootPrefix)) {
                setCurrentPath(pathParam);
            } else {
                // Redirect if trying to access outside rootPrefix
                const params = new URLSearchParams(searchParams);
                params.set('prefix', rootPrefix); // Changed from 'path' to 'prefix'
                router.replace(`${pathname}?${params.toString()}`);
                setCurrentPath(rootPrefix);
            }
        } else {
            setCurrentPath(rootPrefix);
        }
    }, [searchParams, rootPrefix, router, pathname]);

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
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleBack = () => {
        if (!currentPath) return;
        if (currentPath === rootPrefix) return;

        // Remove trailing slash if exists
        const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        const parts = cleanPath.split('/');
        parts.pop(); // Remove last segment
        let newPath = parts.join('/');
        newPath = newPath ? (newPath.endsWith('/') ? newPath : newPath + '/') : '';

        // Ensure we don't go above rootPrefix
        const targetPath = newPath.length < rootPrefix.length ? rootPrefix : newPath;

        const params = new URLSearchParams(searchParams);
        if (targetPath) {
            params.set('prefix', targetPath);
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

    // Upload Logic
    const uploadFile = async (file: File, path: string = '') => {
        const relativePath = path ? path + '/' + file.name : file.name;
        setUploadProgress(prev => ({ ...prev, [relativePath]: 0 }));

        try {
            // 1. Get presigned URL
            const res = await fetch('/api/s3-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    prefix: currentPath + (path ? path + '/' : ''),
                }),
            });

            if (!res.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl } = await res.json();

            // 2. Upload to S3
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    setUploadProgress(prev => ({ ...prev, [relativePath]: percentComplete }));
                }
            };

            return new Promise<void>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[relativePath];
                            return newProgress;
                        });
                        resolve();
                    } else {
                        reject(new Error('Upload failed'));
                    }
                };
                xhr.onerror = () => reject(new Error('Upload failed'));
                xhr.send(file);
            });

        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            // TODO: Handle error UI
        }
    };

    const processEntry = async (entry: FileSystemEntry, path: string = '') => {
        if (entry.isFile) {
            const fileEntry = entry as FileSystemFileEntry;
            return new Promise<void>((resolve) => {
                fileEntry.file(async (file) => {
                    await uploadFile(file, path);
                    resolve();
                });
            });
        } else if (entry.isDirectory) {
            const dirEntry = entry as FileSystemDirectoryEntry;
            const dirReader = dirEntry.createReader();

            const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                dirReader.readEntries((results) => resolve(results));
            });

            const newPath = path ? `${path}/${entry.name}` : entry.name;
            await Promise.all(entries.map(e => processEntry(e, newPath)));
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setUploading(true);

        const items = Array.from(e.dataTransfer.items);

        try {
            const promises = items.map(item => {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    return processEntry(entry);
                }
                return Promise.resolve();
            });

            await Promise.all(promises);
            fetchItems(currentPath); // Refresh list
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    return (
        <div
            className="h-full flex flex-col relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500/20 z-50 flex items-center justify-center border-2 border-blue-500 border-dashed m-2 rounded-lg pointer-events-none">
                    <div className="bg-background p-4 rounded-lg shadow-lg text-lg font-medium">
                        Drop files to upload
                    </div>
                </div>
            )}

            <div className="p-4 border-b flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBack}
                        disabled={!currentPath || currentPath === rootPrefix}
                    >
                        <FaArrowLeft />
                    </Button>
                    <div className="text-sm font-medium truncate flex-1">
                        {currentPath === rootPrefix ? 'Root' : currentPath.replace(rootPrefix, '') || 'Root'}
                    </div>
                </div>
                {uploading && <span className="text-xs text-blue-500 animate-pulse">Uploading...</span>}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-1">
                            {/* Upload Progress Indicators */}
                            {Object.entries(uploadProgress).map(([name, progress]) => (
                                <div key={name} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs mb-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="truncate max-w-[200px]">{name}</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

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
                            {items.length === 0 && Object.keys(uploadProgress).length === 0 && (
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
