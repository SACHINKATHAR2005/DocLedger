import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orgsApi } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { Save, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
    orgId: string;
}

export default function SettingsView({ orgId }: SettingsViewProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [orgName, setOrgName] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const { data: orgData } = useQuery({
        queryKey: ['organizations'],
        queryFn: () => orgsApi.getAll(),
    });

    const currentOrg = orgData?.data?.organizations.find((org) => org.id === orgId);

    useState(() => {
        if (currentOrg) {
            setOrgName(currentOrg.name);
        }
    });

    const updateOrgMutation = useMutation({
        mutationFn: (name: string) => orgsApi.update(orgId, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success('Organization updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update organization');
        },
    });

    const deleteOrgMutation = useMutation({
        mutationFn: () => orgsApi.delete(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success('Organization deleted successfully');
            navigate('/dashboard');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete organization');
        },
    });

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (orgName.trim() && orgName !== currentOrg?.name) {
            updateOrgMutation.mutate(orgName.trim());
        }
    };

    const handleDelete = () => {
        if (confirmText === currentOrg?.name) {
            deleteOrgMutation.mutate();
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <div>
                <h2 className="text-2xl font-bold">Organization Settings</h2>
                <p className="text-muted-foreground">Manage your organization details and preferences</p>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>Update your organization name and details</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="orgName">Organization Name</Label>
                            <Input
                                id="orgName"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="My Organization"
                                disabled={updateOrgMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Organization ID</Label>
                            <Input value={orgId} disabled className="font-mono text-sm" />
                            <p className="text-xs text-muted-foreground">
                                Use this ID for API integrations and references
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Created</Label>
                            <Input
                                value={currentOrg ? new Date(currentOrg.created_at).toLocaleString() : ''}
                                disabled
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={updateOrgMutation.isPending || !orgName.trim() || orgName === currentOrg?.name}
                            >
                                {updateOrgMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Separator />

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions that permanently affect your organization
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h4 className="font-medium mb-1">Delete Organization</h4>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete this organization and all associated documents. This action cannot be
                                undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Organization
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the organization, all
                            documents, and remove all members.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                Type <span className="font-bold">{currentOrg?.name}</span> to confirm
                            </Label>
                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={currentOrg?.name}
                                disabled={deleteOrgMutation.isPending}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeleteDialogOpen(false);
                                    setConfirmText('');
                                }}
                                disabled={deleteOrgMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteOrgMutation.isPending || confirmText !== currentOrg?.name}
                            >
                                {deleteOrgMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Organization'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
