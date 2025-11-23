'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';
import FileExplorer from '@/components/file-explorer';
import FilePreview from '@/components/file-preview';
import { ModeToggle } from '@/components/mode-toggle';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
}

function FileManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; type: string; prefix?: string } | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const fileParam = searchParams.get('file');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => setUser(data))
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (fileParam) {
      setSelectedFile({
        name: fileParam.split('/').pop() || fileParam,
        path: fileParam,
        type: 'file',
      });
    } else {
      setSelectedFile(null);
    }
  }, [fileParam]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleFileSelect = (file: FileItem) => {
    const params = new URLSearchParams(searchParams);
    params.set('file', file.path);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!user) return <div className="flex h-screen items-center justify-center"><FaSpinner className="animate-spin text-4xl" /></div>;

  return (
    <main className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <header className="h-14 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/lemon.svg" alt="Genomas Manager" className="h-6 w-6" />
          <h1 className="font-bold text-lg">Genomas Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          {user.type === 'admin' && (
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
              Admin Panel
            </Button>
          )}
          <span className="text-sm font-medium mr-2">Hello, {user.username}</span>
          <ModeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <FaSignOutAlt /> Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 min-w-[250px] max-w-[400px] border-r bg-white dark:bg-gray-900 h-full">
          <FileExplorer
            onFileSelect={handleFileSelect}
            selectedPath={selectedFile?.path}
            rootPrefix={user.prefix || ''}
          />
        </div>
        <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
          <FilePreview file={selectedFile} />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileManager />
    </Suspense>
  );
}
