import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { orgsApi, docsApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import DocumentsView from '../components/DocumentsView';
import MembersView from '../components/MembersView';
import SettingsView from '../components/SettingsView';
import ChatAnalyticsView from '../components/ChatAnalyticsView';
import ChatHistoryView from '../components/ChatHistoryView';
import ChatPanel from '../components/ChatPanel';
import { FileText, Users, Settings, ArrowLeft, MessageSquare, X, BarChart3, History } from 'lucide-react';

export default function OrgWorkspace() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('documents');
    const [isChatOpen, setIsChatOpen] = useState(false);

    const { data: membersData } = useQuery({
        queryKey: ['members', orgId],
        queryFn: () => orgsApi.getMembers(orgId!),
        enabled: !!orgId,
    });

    const { data: docsData } = useQuery({
        queryKey: ['documents', orgId],
        queryFn: () => docsApi.getAll(orgId!),
        enabled: !!orgId,
    });

    const { data: orgData } = useQuery({
        queryKey: ['organizations'],
        queryFn: () => orgsApi.getAll(),
    });

    const currentOrg = orgData?.data?.organizations.find((org) => org.id === orgId);
    const currentMember = membersData?.data?.members.find((m) => m.user_id === user?.id);
    const isAdmin = currentMember?.role === 'ADMIN';

    const readyDocs = docsData?.data?.documents.filter((doc) => doc.status === 'READY') || [];
    const hasChatAvailable = readyDocs.length > 0;

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header - Compact when chat is open */}
            <header className={`border-b bg-white transition-all ${isChatOpen ? 'px-4 py-2' : 'px-6 py-4'}`}>
                <div className={`flex items-center justify-between ${isChatOpen ? 'mb-0' : 'mb-4'}`}>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className={`font-bold ${isChatOpen ? 'text-base' : 'text-xl'}`}>{currentOrg?.name}</h1>
                            {!isChatOpen && (
                                <p className="text-sm text-muted-foreground">
                                    {isAdmin ? 'Administrator' : currentMember?.role || 'Member'}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        variant={isChatOpen ? 'default' : 'outline'}
                        size={isChatOpen ? 'sm' : 'default'}
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        disabled={!hasChatAvailable}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {isChatOpen ? 'Close' : 'Chat with Docs'}
                    </Button>
                </div>

                {/* Navigation Tabs - Hide when chat is open */}
                {!isChatOpen && (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-transparent border-b-0 w-full justify-start h-auto p-0 space-x-6">
                            <TabsTrigger
                                value="documents"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Documents
                            </TabsTrigger>
                            <TabsTrigger
                                value="members"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Team Members
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
                            >
                                <History className="h-4 w-4 mr-2" />
                                My History
                            </TabsTrigger>
                            {isAdmin && (
                                <>
                                    <TabsTrigger
                                        value="analytics"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Chat Analytics
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="settings"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>
                    </Tabs>
                )}
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'documents' && <DocumentsView orgId={orgId!} isAdmin={isAdmin} />}
                    {activeTab === 'members' && <MembersView orgId={orgId!} isAdmin={isAdmin} />}
                    {activeTab === 'history' && <ChatHistoryView orgId={orgId!} />}
                    {activeTab === 'analytics' && isAdmin && <ChatAnalyticsView orgId={orgId!} />}
                    {activeTab === 'settings' && isAdmin && <SettingsView orgId={orgId!} />}
                </div>

                {/* Chat Panel - Full Height on Right Side (VS Code Copilot Style) */}
                {isChatOpen && (
                    <div className="w-[500px] border-l bg-white flex flex-col shadow-xl">
                        <div className="flex-1 overflow-hidden">
                            <ChatPanel orgId={orgId!} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
