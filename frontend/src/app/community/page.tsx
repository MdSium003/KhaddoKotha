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

export default function CommunityPage() {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const [postComments, setPostComments] = useState<Record<number, PostComment[]>>({});
    const { user } = useAuth();

    useEffect(() => {
        loadPosts();
    }, []);

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
                    <div className="max-w-3xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-[#714B67] mb-3">Community Feed</h1>
                            <p className="text-slate-600">Share food, reduce waste, help neighbors</p>
                        </div>

                        {/* Create Post Button */}
                        {user && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-full mb-6 p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-[#714B67] hover:bg-[#714B67]/5 transition-all text-slate-600 hover:text-[#714B67] font-medium"
                            >
                                ✏️ Create a Post
                            </button>
                        )}

                        {/* Feed */}
                        {loading ? (
                            <div className="text-center py-12 text-slate-500">Loading feed...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                                <div className="text-6xl mb-4">📢</div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No posts yet</h3>
                                <p className="text-slate-500">Be the first to share!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#714B67] rounded-full flex items-center justify-center text-white font-semibold">
                        {post.author_name ? post.author_name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{post.author_name}</div>
                        <div className="text-xs text-slate-500">{timeAgo}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${post.post_type === "donate"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                        }`}>
                        {post.post_type === "donate" ? "🎁 I want to donate" : "🙏 I need"}
                    </span>
                    {isOwnPost && (
                        <button
                            onClick={onDelete}
                            className="text-slate-400 hover:text-red-600 transition-colors"
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
            <div className="mb-4">
                <div className="text-lg font-bold text-slate-900 mb-2">
                    🥬 {post.food_name} - {post.quantity}{post.unit || " units"}
                </div>
                <div className="text-sm text-slate-600 mb-2">
                    {post.post_type === "donate" ? "Expires on:" : "Needed by:"} {new Date(post.target_date).toLocaleDateString()}
                </div>
                {post.details && (
                    <p className="text-slate-700">{post.details}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                <button
                    onClick={onToggleComments}
                    className="flex items-center gap-2 text-slate-600 hover:text-[#714B67] transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">{post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}</span>
                </button>
            </div>

            {/* Comments Section */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    {/* Comment List */}
                    <div className="space-y-3 mb-4">
                        {comments.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-2">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-xs font-semibold">
                                                {comment.author_name ? comment.author_name[0].toUpperCase() : "?"}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">{comment.author_name}</span>
                                        </div>
                                        {currentUser && currentUser.id === comment.user_id && (
                                            <button
                                                onClick={() => onDeleteComment(comment.id)}
                                                className="text-slate-400 hover:text-red-600 text-xs"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-700 ml-8">{comment.comment_text}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Comment */}
                    {currentUser && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                            />
                            <button
                                onClick={handleSubmitComment}
                                disabled={!commentText.trim()}
                                className="px-4 py-2 bg-[#714B67] text-white rounded-lg hover:bg-[#5d3d55] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!foodName || !quantity || !targetDate) return;

        setSubmitting(true);
        try {
            const newPost = await createCommunityPost({
                postType,
                foodName,
                quantity: parseFloat(quantity),
                unit: unit || undefined,
                targetDate,
                details: details || undefined,
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Create Community Post</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Post Type Toggle */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Post Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPostType("need")}
                                className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${postType === "need"
                                    ? "bg-blue-100 border-blue-500 text-blue-700"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                    }`}
                            >
                                🙏 I need
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType("donate")}
                                className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${postType === "donate"
                                    ? "bg-green-100 border-green-500 text-green-700"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                    }`}
                            >
                                🎁 I want to donate
                            </button>
                        </div>
                    </div>

                    {/* Food Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Food Name *</label>
                        <input
                            type="text"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            placeholder="e.g., Lettuce, Rice, Apples"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                        />
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="500"
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                            <input
                                type="text"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="kg, g, units"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {postType === "donate" ? "Expires on *" : "Needed by *"}
                        </label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                        />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Details (optional)</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Add any additional information..."
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !foodName || !quantity || !targetDate}
                            className="flex-1 py-3 px-4 bg-[#714B67] text-white rounded-lg font-semibold hover:bg-[#5d3d55] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
