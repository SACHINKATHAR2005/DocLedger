import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../lib/api';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, MessageSquare, Clock, TrendingUp, FileText, Users, BarChart, Search, Calendar } from 'lucide-react';

interface ChatAnalyticsViewProps {
    orgId: string;
}

export default function ChatAnalyticsView({ orgId }: ChatAnalyticsViewProps) {
    const { data: analyticsData, isLoading } = useQuery({
        queryKey: ['chat-analytics', orgId],
        queryFn: () => chatApi.getChatAnalytics(orgId),
        enabled: !!orgId,
    });

    const { data: advancedData, isLoading: isLoadingAdvanced } = useQuery({
        queryKey: ['chat-analytics-advanced', orgId],
        queryFn: () => chatApi.getAdvancedAnalytics(orgId),
        enabled: !!orgId,
    });

    const analytics = analyticsData?.data?.analytics || [];
    const advanced = advancedData?.data || {};
    const { frequentQuestions = [], popularTopics = [], documentUsage = [], activityTimeline = [], metrics = {} } = advanced;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDateShort = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Chat Analytics Dashboard</h2>
                <p className="text-muted-foreground">
                    Comprehensive insights into team engagement and document usage
                </p>
            </div>

            {/* Tabs for different analytics views */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <BarChart className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="questions">
                        <Search className="h-4 w-4 mr-2" />
                        Popular Questions
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                        <FileText className="h-4 w-4 mr-2" />
                        Document Usage
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="h-4 w-4 mr-2" />
                        User Activity
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Users</p>
                                    <p className="text-2xl font-bold">{analytics.length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Conversations</p>
                                    <p className="text-2xl font-bold">
                                        {analytics.reduce((sum, a) => sum + a.total_conversations, 0)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Questions</p>
                                    <p className="text-2xl font-bold">{metrics.total_questions || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Question Length</p>
                                    <p className="text-2xl font-bold">{metrics.avg_question_length || 0}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Popular Topics */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Trending Search Topics
                        </h3>
                        {isLoadingAdvanced ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : popularTopics.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No topics data available</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {popularTopics.slice(0, 12).map((topic: any, idx: number) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-sm px-3 py-1"
                                    >
                                        {topic.word}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ×{topic.frequency}
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Activity Timeline */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Recent Activity (Last 30 Days)
                        </h3>
                        {isLoadingAdvanced ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : activityTimeline.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No recent activity</p>
                        ) : (
                            <div className="space-y-2">
                                {activityTimeline.slice(0, 7).map((day: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-sm font-medium">{formatDateShort(day.date)}</span>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-muted-foreground">
                                                {day.message_count} messages
                                            </span>
                                            <Badge variant="outline">{day.active_users} users</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* Popular Questions Tab */}
                <TabsContent value="questions" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Most Frequently Asked Questions</h3>
                        {isLoadingAdvanced ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : frequentQuestions.length === 0 ? (
                            <div className="text-center py-12">
                                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No questions asked yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {frequentQuestions.map((q: any, idx: number) => (
                                    <div key={idx} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <Badge className="mt-1">{idx + 1}</Badge>
                                            <div className="flex-1">
                                                <p className="font-medium mb-2">{q.question}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="h-4 w-4" />
                                                        Asked {q.frequency}× times
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        By {q.asked_by_users} users
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        Last: {formatDateShort(q.last_asked)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* Document Usage Tab */}
                <TabsContent value="documents" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Most Referenced Documents</h3>
                        {isLoadingAdvanced ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : documentUsage.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No documents referenced yet</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Document Name</TableHead>
                                            <TableHead>Times Referenced</TableHead>
                                            <TableHead>Users Accessed</TableHead>
                                            <TableHead>Last Accessed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documentUsage.map((doc: any, idx: number) => (
                                            <TableRow key={doc.id}>
                                                <TableCell>
                                                    <Badge variant={idx < 3 ? 'default' : 'secondary'}>
                                                        #{idx + 1}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{doc.file_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{doc.times_referenced}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {doc.users_accessed}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDateShort(doc.last_accessed)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* User Activity Tab */}

                <TabsContent value="users" className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : analytics.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-muted-foreground">No chat activity yet</p>
                        </div>
                    ) : (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">User Engagement Details</h3>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Conversations</TableHead>
                                            <TableHead>Total Messages</TableHead>
                                            <TableHead>Last Activity</TableHead>
                                            <TableHead>First Activity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics.map((stat) => (
                                            <TableRow key={stat.user_id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                                {stat.user_name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{stat.user_name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {stat.user_email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{stat.total_conversations}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{stat.total_messages}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-muted-foreground">
                                                            {formatDate(stat.last_activity)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(stat.first_activity)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
