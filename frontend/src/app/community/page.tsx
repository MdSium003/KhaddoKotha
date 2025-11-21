"use client";

import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
    fetchCommunityPosts,
    createCommunityPost,
    deleteCommunityPost,
    addComment,
    deleteComment,
    fetchPostWithComments,
    CommunityPost,
    PostComment,
} from "@/lib/api";
import { LocationPicker } from "@/components/location-picker";
import { PostLocationMap } from "@/components/post-location-map";
import { CommunityMapView } from "@/components/community-map-view";

export default function CommunityPage() {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const [postComments, setPostComments] = useState<Record<number, PostComment[]>>({});
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        loadPosts();
        getUserLocation();
    }, []);

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                () => {
                    // User denied or error getting location
                    console.log("Location access denied or unavailable");
                }
            );
        }
    };

    async function loadPosts() {
        try {
            const data = await fetchCommunityPosts();
            setPosts(data);
        } catch (error) {
            console.error("Failed to load posts:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeletePost(postId: number) {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            await deleteCommunityPost(postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    }

    async function toggleComments(postId: number) {
        if (expandedPost === postId) {
            setExpandedPost(null);
            return;
        }

        setExpandedPost(postId);

        if (!postComments[postId]) {
            try {
                const { comments } = await fetchPostWithComments(postId);
                setPostComments({ ...postComments, [postId]: comments });
            } catch (error) {
                console.error("Failed to load comments:", error);
            }
        }
    }

    async function handleAddComment(postId: number, commentText: string) {
        try {
            const comment = await addComment(postId, commentText);
            setPostComments({
                ...postComments,
                [postId]: [...(postComments[postId] || []), comment],
            });

            // Update comment count in posts
            setPosts(posts.map(p =>
                p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
            ));
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    }

    async function handleDeleteComment(postId: number, commentId: number) {
        if (!confirm("Delete this comment?")) return;

        try {
            await deleteComment(commentId);
            setPostComments({
                ...postComments,
                [postId]: postComments[postId].filter(c => c.id !== commentId),
            });

            // Update comment count
            setPosts(posts.map(p =>
                p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p
            ));
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    }

    return (
        <div className="min-h-screen bg-[#BCEBD7] text-slate-900 font-sans">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8 pt-24">
                <SiteHeader />

                <main className="flex-1 py-12">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                Community Hub
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                                Share & Connect
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Join our community to share surplus food, help neighbors in need, and reduce waste together
                            </p>

                            {/* Stats */}
                            <div className="flex items-center justify-center gap-8 mt-8">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-emerald-600">{posts.length}</div>
                                    <div className="text-sm text-slate-500 font-medium">Active Posts</div>
                                </div>
                                <div className="w-px h-12 bg-slate-200"></div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-teal-600">
                                        {posts.reduce((sum, post) => sum + post.comment_count, 0)}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">Community Responses</div>
                                </div>
                            </div>
                        </div>

                        {/* View Toggle and Create Post */}
                        <div className="mb-8 space-y-4">
                            {/* Professional View Toggle */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 border border-slate-200 shadow-lg">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="flex-1 bg-slate-100 rounded-xl p-1.5 flex items-center gap-1.5">
                                            <button
                                                onClick={() => setViewMode("list")}
                                                className={`flex-1 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 ${
                                                    viewMode === "list"
                                                        ? "bg-white text-emerald-700 shadow-md shadow-emerald-500/20 border border-emerald-200"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                <svg className={`w-5 h-5 ${viewMode === "list" ? "text-emerald-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                                <span>List View</span>
                                            </button>
                                            <button
                                                onClick={() => setViewMode("map")}
                                                className={`flex-1 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 ${
                                                    viewMode === "map"
                                                        ? "bg-white text-emerald-700 shadow-md shadow-emerald-500/20 border border-emerald-200"
                                                        : "text-slate-600 hover:text-slate-900"
                                                }`}
                                            >
                                                <svg className={`w-5 h-5 ${viewMode === "map" ? "text-emerald-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                </svg>
                                                <span>Map View</span>
                                            </button>
                                        </div>
                                    </div>
                                    {user && (
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>Create Post</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Create Post Button (Alternative for list view) */}
                            {user && viewMode === "list" && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-dashed border-emerald-300 rounded-2xl hover:border-emerald-500 hover:bg-white hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-slate-900">Create a Post</div>
                                            <div className="text-sm text-slate-500">Share food or request help from the community</div>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Feed or Map View */}
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-500 font-medium">Loading community posts...</p>
                            </div>
                        ) : viewMode === "map" ? (
                            <div className="space-y-4">
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-slate-900">Map View</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                                                <span>Donating</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                                                <span>Requesting</span>
                                            </div>
                                            {userLocation && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm"></div>
                                                    <span>Your Location</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500">Click on any marker to view post details</p>
                                </div>
                                <CommunityMapView 
                                    posts={posts} 
                                    userLocation={userLocation}
                                    onPostClick={(post) => {
                                        setSelectedPost(post);
                                        setExpandedPost(post.id);
                                        if (!postComments[post.id]) {
                                            fetchPostWithComments(post.id).then(({ comments }) => {
                                                setPostComments({ ...postComments, [post.id]: comments });
                                            }).catch(console.error);
                                        }
                                    }}
                                />
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">No posts yet</h3>
                                <p className="text-slate-500 mb-6">Be the first to share with the community!</p>
                                {user && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create First Post
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUser={user}
                                        onDelete={() => handleDeletePost(post.id)}
                                        onToggleComments={() => toggleComments(post.id)}
                                        isExpanded={expandedPost === post.id}
                                        comments={postComments[post.id] || []}
                                        onAddComment={(text) => handleAddComment(post.id, text)}
                                        onDeleteComment={(commentId) => handleDeleteComment(post.id, commentId)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <SiteFooter />
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(newPost) => {
                        setPosts([newPost, ...posts]);
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Post Details Modal (from map click) */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedPost(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900">Post Details</h3>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <PostCard
                                post={selectedPost}
                                currentUser={user}
                                onDelete={() => {
                                    handleDeletePost(selectedPost.id);
                                    setSelectedPost(null);
                                }}
                                onToggleComments={() => {
                                    if (expandedPost === selectedPost.id) {
                                        setExpandedPost(null);
                                    } else {
                                        setExpandedPost(selectedPost.id);
                                        if (!postComments[selectedPost.id]) {
                                            fetchPostWithComments(selectedPost.id).then(({ comments }) => {
                                                setPostComments({ ...postComments, [selectedPost.id]: comments });
                                            }).catch(console.error);
                                        }
                                    }
                                }}
                                isExpanded={expandedPost === selectedPost.id}
                                comments={postComments[selectedPost.id] || []}
                                onAddComment={(text) => handleAddComment(selectedPost.id, text)}
                                onDeleteComment={(commentId) => handleDeleteComment(selectedPost.id, commentId)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Post Card Component
function PostCard({
    post,
    currentUser,
    onDelete,
    onToggleComments,
    isExpanded,
    comments,
    onAddComment,
    onDeleteComment,
}: {
    post: CommunityPost;
    currentUser: any;
    onDelete: () => void;
    onToggleComments: () => void;
    isExpanded: boolean;
    comments: PostComment[];
    onAddComment: (text: string) => void;
    onDeleteComment: (commentId: number) => void;
}) {
    const [commentText, setCommentText] = useState("");

    const handleSubmitComment = () => {
        if (!commentText.trim()) return;
        onAddComment(commentText);
        setCommentText("");
    };

    const isOwnPost = currentUser && currentUser.id === post.user_id;
    const postDate = new Date(post.created_at);
    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const timeAgo = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-emerald-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {post.author_name ? post.author_name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{post.author_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeAgo}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${post.post_type === "donate"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        }`}>
                        {post.post_type === "donate" ? "🎁 Donating" : "🙏 Requesting"}
                    </span>
                    {isOwnPost && (
                        <button
                            onClick={onDelete}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete post"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mb-5">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl">
                        🥬
                    </div>
                    <div className="flex-1">
                        <div className="text-xl font-bold text-slate-900 mb-1">
                            {post.food_name}
                        </div>
                        <div className="text-sm font-semibold text-emerald-600">
                            {post.quantity}{post.unit || " units"}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2.5 mb-3">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">
                        {post.post_type === "donate" ? "Expires:" : "Needed by:"}
                    </span>
                    <span className="font-semibold text-slate-900">
                        {new Date(post.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                {post.details && (
                    <p className="text-slate-700 leading-relaxed bg-slate-50/50 rounded-lg px-4 py-3 border-l-4 border-emerald-400">
                        {post.details}
                    </p>
                )}
                
                {/* Location Map */}
                {post.latitude && post.longitude && (
                    <div className="mt-4">
                        <PostLocationMap 
                            latitude={post.latitude} 
                            longitude={post.longitude} 
                            address={post.address}
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <button
                    onClick={onToggleComments}
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium group"
                >
                    <div className="p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <span>{post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}</span>
                </button>
            </div>

            {/* Comments Section */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t-2 border-slate-100">
                    {/* Comment List */}
                    <div className="space-y-3 mb-5">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">No comments yet. Be the first to respond!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                                {comment.author_name ? comment.author_name[0].toUpperCase() : "?"}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{comment.author_name}</span>
                                        </div>
                                        {currentUser && currentUser.id === comment.user_id && (
                                            <button
                                                onClick={() => onDeleteComment(comment.id)}
                                                className="text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-all font-medium"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed ml-10">{comment.comment_text}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Comment */}
                    {currentUser && (
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                            />
                            <button
                                onClick={handleSubmitComment}
                                disabled={!commentText.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold disabled:hover:shadow-none"
                            >
                                Post
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Create Post Modal Component
function CreatePostModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: (post: CommunityPost) => void;
}) {
    const [postType, setPostType] = useState<"need" | "donate">("donate");
    const [foodName, setFoodName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [details, setDetails] = useState("");
    const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!foodName || !quantity || !targetDate || !location) {
            alert("Please provide all required information including location.");
            return;
        }

        setSubmitting(true);
        try {
            const newPost = await createCommunityPost({
                postType,
                foodName,
                quantity: parseFloat(quantity),
                unit: unit || undefined,
                targetDate,
                details: details || undefined,
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
            });
            onSuccess(newPost);
        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Failed to create post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Professional Header */}
                <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Create Community Post</h2>
                                <p className="text-sm text-emerald-50 mt-0.5">Share food and connect with neighbors</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all flex items-center justify-center group"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Post Type Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Post Type
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPostType("need")}
                                    className={`group relative py-5 px-5 rounded-xl font-semibold transition-all border-2 overflow-hidden ${postType === "need"
                                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-400 text-white shadow-xl shadow-blue-500/30 scale-[1.02]"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                                        }`}
                                >
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <span className="text-2xl">🙏</span>
                                        <span>I Need</span>
                                    </div>
                                    {postType === "need" && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPostType("donate")}
                                    className={`group relative py-5 px-5 rounded-xl font-semibold transition-all border-2 overflow-hidden ${postType === "donate"
                                        ? "bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50"
                                        }`}
                                >
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <span className="text-2xl">🎁</span>
                                        <span>I Want to Donate</span>
                                    </div>
                                    {postType === "donate" && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Food Information Section */}
                        <div className="space-y-5 p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-slate-800">Food Details</h3>
                            </div>

                            {/* Food Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                                    Food Name
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={foodName}
                                        onChange={(e) => setFoodName(e.target.value)}
                                        placeholder="e.g., Fresh Lettuce, Organic Rice, Red Apples"
                                        required
                                        className="w-full px-4 py-3.5 pl-11 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white text-slate-900 placeholder:text-slate-400"
                                    />
                                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>

                            {/* Quantity & Unit */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                                        Quantity
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="500"
                                            required
                                            className="w-full px-4 py-3.5 pl-11 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white text-slate-900 placeholder:text-slate-400"
                                        />
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                                        Unit
                                        <span className="text-xs font-normal text-slate-500">(optional)</span>
                                    </label>
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white text-slate-900"
                                    >
                                        <option value="">Select unit</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="g">Grams (g)</option>
                                        <option value="lbs">Pounds (lbs)</option>
                                        <option value="units">Units</option>
                                        <option value="pieces">Pieces</option>
                                        <option value="packages">Packages</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Date & Details Section */}
                        <div className="space-y-5 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-slate-800">Timeline & Information</h3>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                                    {postType === "donate" ? (
                                        <>
                                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Expires on
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Needed by
                                        </>
                                    )}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white text-slate-900"
                                />
                            </div>

                            {/* Details */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Additional Details
                                    <span className="text-xs font-normal text-slate-500">(optional)</span>
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Add any additional information, special instructions, or notes about the food..."
                                    rows={4}
                                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="p-5 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-slate-800">Location</h3>
                            </div>
                            <LocationPicker onLocationSelect={setLocation} />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 px-6 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !foodName || !quantity || !targetDate || !location}
                                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Posting...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span>Create Post</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
