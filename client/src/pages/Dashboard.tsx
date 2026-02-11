import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orgsApi, authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';
import { FileText, Plus, Building2, Users, LogOut, Loader2 } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout: logoutStore } = useAuthStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [orgName, setOrgName] = useState('');

    const { data: orgsData, isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: () => orgsApi.getAll(),
    });

    const createOrgMutation = useMutation({
        mutationFn: (name: string) => orgsApi.create({ name }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success('Organization created successfully!');
            setIsCreateOpen(false);
            setOrgName('');
            if (response.data) {
                navigate(`/orgs/${response.data.organization.id}`);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create organization');
        },
    });

    const logoutMutation = useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            logoutStore();
            navigate('/signin');
            toast.success('Logged out successfully');
        },
    });

    const handleCreateOrg = (e: React.FormEvent) => {
        e.preventDefault();
        if (orgName.trim()) {
            createOrgMutation.mutate(orgName.trim());
        }
    };

    const organizations = orgsData?.data?.organizations || [];
    const adminOrgs = organizations.filter((org) => org.role === 'ADMIN');
    const teamLeadOrgs = organizations.filter((org) => org.role === 'TEAM_LEAD');
    const memberOrgs = organizations.filter((org) => org.role === 'MEMBER');

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="border-b bg-white">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold">TaskLedger</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Organization
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Organization</DialogTitle>
                                    <DialogDescription>
                                        Create a new organization to manage documents and collaborate with your team.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateOrg} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="orgName">Organization Name</Label>
                                        <Input
                                            id="orgName"
                                            placeholder="My Organization"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            disabled={createOrgMutation.isPending}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateOpen(false)}
                                            disabled={createOrgMutation.isPending}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createOrgMutation.isPending || !orgName.trim()}>
                                            {createOrgMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : organizations.length === 0 ? (
                    // No Organizations View
                    <div className="max-w-2xl mx-auto text-center py-12">
                        <div className="rounded-full bg-primary/10 p-6 inline-block mb-6">
                            <Building2 className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No Organizations Yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Create your first organization to start managing documents and collaborating with your team.
                        </p>
                        <Button size="lg" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-5 w-5" />
                            Create Your First Organization
                        </Button>
                    </div>
                ) : (
                    // Organizations List
                    <div className="space-y-8">

                        {/* Admin Organizations */}
                        {adminOrgs.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-lg font-semibold">Organizations You Manage</h2>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                                        Admin
                                    </Badge>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {adminOrgs.map((org) => (
                                        <Card
                                            key={org.id}
                                            className="hover:border-primary/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/orgs/${org.id}`)}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="rounded-lg bg-primary/10 p-2 mb-2">
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                        ADMIN
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-lg">{org.name}</CardTitle>
                                                <CardDescription>
                                                    Created {new Date(org.created_at).toLocaleDateString()}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    Manage members & documents
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team Lead Organizations */}
                        {teamLeadOrgs.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-lg font-semibold">Team Lead</h2>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                        TEAM LEAD
                                    </Badge>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {teamLeadOrgs.map((org) => (
                                        <Card
                                            key={org.id}
                                            className="hover:border-primary/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/orgs/${org.id}`)}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="rounded-lg bg-amber-50 p-2 mb-2">
                                                        <Building2 className="h-5 w-5 text-amber-700" />
                                                    </div>
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">TEAM LEAD</Badge>
                                                </div>
                                                <CardTitle className="text-lg">{org.name}</CardTitle>
                                                <CardDescription>
                                                    Joined {new Date(org.created_at).toLocaleDateString()}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    Manage team & documents
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Member Organizations */}
                        {memberOrgs.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-lg font-semibold">Member Of</h2>
                                    <Badge variant="outline">
                                        MEMBER
                                    </Badge>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {memberOrgs.map((org) => (
                                        <Card
                                            key={org.id}
                                            className="hover:border-primary/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/orgs/${org.id}`)}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="rounded-lg bg-slate-100 p-2 mb-2">
                                                        <Building2 className="h-5 w-5 text-slate-600" />
                                                    </div>
                                                    <Badge variant="outline">{org.role}</Badge>
                                                </div>
                                                <CardTitle className="text-lg">{org.name}</CardTitle>
                                                <CardDescription>
                                                    Joined {new Date(org.created_at).toLocaleDateString()}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View & upload documents
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
