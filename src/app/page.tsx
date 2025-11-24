'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSignOutAlt, FaSpinner, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import FileExplorer from '@/components/file-explorer';
import FilePreview from '@/components/file-preview';
import { ThemeColorPicker } from '@/components/theme-color-picker';
import { Input } from '@/components/ui/input';

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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        alert('Password changed successfully');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      alert('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center"><FaSpinner className="animate-spin text-4xl" /></div>;

  return (
    <main className="flex h-screen flex-col overflow-hidden" style={{ background: `hsl(var(--theme-background))`, color: `hsl(var(--theme-foreground))` }} role="main">
      <header className="h-14 border-b flex items-center justify-between px-6 shrink-0" style={{ background: `hsl(var(--theme-card))`, borderColor: `hsl(var(--theme-border))`, color: `hsl(var(--theme-foreground))` }} role="banner">
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
          <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(true)} className="gap-2" aria-label="Change password">
            <FaKey /> Change Password
          </Button>
          <ThemeColorPicker />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2" aria-label="Logout">
            <FaSignOutAlt /> Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 min-w-[250px] max-w-[400px] border-r h-full" style={{ background: `hsl(var(--theme-card))`, borderColor: `hsl(var(--theme-border))`, color: `hsl(var(--theme-foreground))` }}>
          <FileExplorer
            onFileSelect={handleFileSelect}
            selectedPath={selectedFile?.path}
            rootPrefix={user.prefix || ''}
          />
        </div>
        <div className="flex-1 h-full p-4 overflow-hidden" style={{ background: `hsl(var(--theme-background))` }}>
          <FilePreview file={selectedFile} />
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background p-6 rounded-lg shadow-xl w-full max-w-md border" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
