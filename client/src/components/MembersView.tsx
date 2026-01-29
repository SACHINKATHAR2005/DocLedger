import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgsApi } from '../lib/api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import { UserPlus, Trash2, Loader2, Shield, User } from 'lucide-react';
import type { OrganizationMember } from '../types';

interface MembersViewProps {
    orgId: string;
    isAdmin: boolean;
}

export default function MembersView({ orgId, isAdmin }: MembersViewProps) {
    const queryClient = useQueryClient();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'TEAM_LEAD'>('MEMBER');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

    const { data: membersData, isLoading } = useQuery({
        queryKey: ['members', orgId],
        queryFn: () => orgsApi.getMembers(orgId),
        enabled: !!orgId,
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string; role: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD' }) =>
            orgsApi.invite(orgId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', orgId] });
            toast.success('Member invited successfully!');
            setInviteOpen(false);
            setEmail('');
            setRole('MEMBER');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to invite member');
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD' }) =>
            orgsApi.updateMemberRole(orgId, userId, { role: newRole }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', orgId] });
            toast.success('Member role updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update role');
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => orgsApi.removeMember(orgId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', orgId] });
            toast.success('Member removed successfully');
            setDeleteDialogOpen(false);
            setSelectedMember(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove member');
        },
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            inviteMutation.mutate({ email: email.trim(), role });
        }
    };

    const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'MEMBER' | 'TEAM_LEAD') => {
        updateRoleMutation.mutate({ userId, newRole });
    };

    const members = membersData?.data?.members || [];
    const adminCount = members.filter((m) => m.role === 'ADMIN').length;

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                    </Badge>
                );
            case 'TEAM_LEAD':
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Team Lead
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline">
                        <User className="mr-1 h-3 w-3" />
                        Member
                    </Badge>
                );
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Team Members</h2>
                    <p className="text-muted-foreground">{members.length} members in this organization</p>
                </div>
                {isAdmin && (
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite Team Member</DialogTitle>
                                <DialogDescription>
                                    Invite a user to join this organization by their email address.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={inviteMutation.isPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEMBER">Member</SelectItem>
                                            <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {role === 'ADMIN'
                                            ? 'Full access to manage organization, members, and documents'
                                            : role === 'TEAM_LEAD'
                                                ? 'Can manage team members and documents'
                                                : 'Can view and upload documents'}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setInviteOpen(false)}
                                        disabled={inviteMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={inviteMutation.isPending || !email.trim()}>
                                        {inviteMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Inviting...
                                            </>
                                        ) : (
                                            'Send Invite'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Members Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.user_id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                    {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isAdmin ? (
                                            <Select
                                                value={member.role}
                                                onValueChange={(val: any) => handleRoleChange(member.user_id, val)}
                                                disabled={member.role === 'ADMIN' && adminCount === 1}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="MEMBER">Member</SelectItem>
                                                    <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            getRoleBadge(member.role)
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                disabled={member.role === 'ADMIN' && adminCount === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Remove Member Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove {selectedMember?.user?.name} from this organization?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={removeMemberMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedMember && removeMemberMutation.mutate(selectedMember.user_id)}
                            disabled={removeMemberMutation.isPending}
                        >
                            {removeMemberMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
