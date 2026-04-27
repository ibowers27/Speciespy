/**
 * Discussion screen for viewing a post and its comments. Allows users to add comments, reply to existing comments, 
 * and like comments. Handles loading states, error states, and real-time updates using Firebase Firestore.
 * Users can also delete their own posts. The screen is styled using theme colors and is responsive to keyboard interactions.
 * 
 * Inspired by youtube video: https://www.youtube.com/watch?v=xaTar22Wgic 
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPost, deletePost } from '@/services/postService';
import { subscribeToComments, addComment, toggleCommentLike } from '@/services/commentService';
import { auth } from '@/firebase/fbconfig';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useHeaderHeight } from '@react-navigation/elements';

export default function DiscussionScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);
  const colors = useThemeColors();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Load the post and subscribe to real-time comment updates
  useEffect(() => {
    if (!postId) {
      setErrorMsg('No post ID provided');
      setLoading(false);
      return;
    }
 
    let unsubscribe: any;
 
    getPost(postId)
      .then((loadedPost) => {
        if (!loadedPost) setErrorMsg('Post not found');
        setPost(loadedPost);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(`Failed to load: ${err.message}`);
        setLoading(false);
      });
 
    try {
      unsubscribe = subscribeToComments(postId, (loadedComments) => {
        setComments(loadedComments);
      });
    } catch (err: any) {
      console.error('Error with comments:', err);
    }
 
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [postId]);
 
  /** Adds a new comment or reply to the current post */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
 
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'Please sign in to comment');
      return;
    }
 
    try {
      await addComment(postId, newComment, replyingTo);
      setNewComment('');
      setReplyingTo(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };
 
  /** Prompts the user to confirm post deletion, then navigates back */
  const handleDelete = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              Alert.alert('Deleted', 'Post deleted successfully');
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };
 
  /** Toggles a like on a comment (only for other users' comments) */
  const handleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'Please sign in to like');
      return;
    }
 
    try {
      await toggleCommentLike(commentId, currentlyLiked);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };
 
  /** Renders a single comment with like/reply actions */
  const renderComment = (item: any) => {
    const currentUserId = auth.currentUser?.uid;
    const isLiked = item.likedBy?.includes(currentUserId || '');
    const isReply = item.parentCommentId !== null;
    const isOwnComment = item.userId === currentUserId;
 
    return (
      <View key={item.id} style={[
        styles.comment,
        { borderBottomColor: colors.separator },
        isReply && { marginLeft: 30, backgroundColor: colors.reply },
      ]}>
        <View style={styles.commentHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
          <Text style={[styles.timestamp, { color: colors.textMuted }]}>
            {item.timestamp?.toDate?.()?.toLocaleDateString() || 'Just now'}
          </Text>
        </View>
 
        <Text style={[styles.commentText, { color: colors.text }]}>{item.text}</Text>
 
        <View style={styles.commentActions}>
          {/* Like button (hidden on own comments) */}
          {!isOwnComment && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item.id, isLiked)}
            >
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {isLiked ? '❤️' : '🤍'} {item.likes || 0}
              </Text>
            </TouchableOpacity>
          )}
 
          {/* Like count display for own comments */}
          {isOwnComment && item.likes > 0 && (
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              ❤️ {item.likes}
            </Text>
          )}
 
          {/* Reply button */}
          {!isReply && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setReplyingTo(item.id)}
            >
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>💬 Reply</Text>
            </TouchableOpacity>
          )}
        </View>
        {replyingTo === item.id && (
          <View style={styles.replyInput}>
            <TextInput
              style={[styles.replyInputField, {
                borderColor: colors.inputBorder,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }]}
              placeholder="Write a reply..."
              placeholderTextColor={colors.placeholder}
              value={newComment}
              onChangeText={setNewComment}
              autoFocus
            />
            <TouchableOpacity onPress={handleAddComment}>
              <Text style={[styles.postButton, { color: colors.primary }]}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={[styles.cancelButton, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
 
  // Loading
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading...</Text>
      </View>
    );
  }
 
  // Render error message if post failed to load or doesn't exist
  if (errorMsg || !post) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 18, color: colors.error, marginBottom: 10 }}>
          {errorMsg || 'Post not found'}
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>ID: {postId}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: colors.primary, padding: 10, borderRadius: 8 }}
        >
          <Text style={{ color: colors.primaryText }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  // Separate comments from replies for threaded display
  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parentCommentId === commentId);
 
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (newComment || replyingTo) {
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {/* Post image */}
          <Image source={{ uri: post.imageUrl }} style={styles.image} contentFit="cover" />
 
          {/* Species info and delete button if owner */}
          <View style={[styles.postInfo, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.commonName, { color: colors.text }]}>{post.commonName}</Text>
            <Text style={[styles.scientificName, { color: colors.textSecondary }]}>
              {post.scientificName}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              Posted by {post.userName}
              {post.confidence > 0 && ` • ${(post.confidence * 100).toFixed(0)}%`}
            </Text>
 
            {auth.currentUser?.uid === post.userId && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.deleteBackground }]}
                onPress={handleDelete}
              >
                <Text style={[styles.deleteText, { color: colors.error }]}>🗑️ Delete Post</Text>
              </TouchableOpacity>
            )}
          </View>
 
          {/* Comments section header */}
          <View style={[styles.commentsHeader, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>
              Comments ({comments.length})
            </Text>
          </View>
 
          {comments.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>No comments yet. Be the first!</Text>
            </View>
          )}
 
          {/* Threaded comments: initial comment followed by their replies */}
          {topLevelComments.map((comment) => (
            <View key={comment.id}>
              {renderComment(comment)}
              {getReplies(comment.id).map((reply) => renderComment(reply))}
            </View>
          ))}
        </ScrollView>
      </TouchableWithoutFeedback>
 
      {/* Bottom comment input bar (hidden when replying) */}
      {!replyingTo && (
        <View style={[styles.addCommentContainer, {
          backgroundColor: colors.card,
          borderTopColor: colors.separator,
        }]}>
          <TextInput
            style={[styles.input, {
              borderColor: colors.inputBorder,
              color: colors.text,
              backgroundColor: colors.inputBackground,
            }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.placeholder}
            value={newComment}
            onChangeText={setNewComment}
            onFocus={() => {
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleAddComment}
          >
            <Text style={[styles.sendButtonText, { color: colors.primaryText }]}>Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: '100%', height: 300 },
  postInfo: { padding: 15, borderBottomWidth: 1 },
  commonName: { fontSize: 24, fontWeight: 'bold' },
  scientificName: { fontSize: 18, fontStyle: 'italic', marginTop: 5 },
  meta: { fontSize: 14, marginTop: 5 },
  deleteButton: {
    marginTop: 10,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteText: {
    fontWeight: '600',
  },
  commentsHeader: { padding: 15, borderBottomWidth: 1 },
  commentsTitle: { fontSize: 18, fontWeight: '600' },
  comment: { padding: 15, borderBottomWidth: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  userName: { fontWeight: '600', fontSize: 14 },
  timestamp: { fontSize: 12 },
  commentText: { fontSize: 15, marginBottom: 8 },
  commentActions: { flexDirection: 'row', gap: 15 },
  actionButton: { paddingVertical: 4 },
  actionText: { fontSize: 13 },
  replyInput: { marginTop: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  replyInputField: { flex: 1, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 6 },
  addCommentContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 15 },
  sendButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginLeft: 10 },
  sendButtonText: { fontWeight: '600' },
  postButton: { fontWeight: '600' },
  cancelButton: {},
});