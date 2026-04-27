/**
 * Service for handling comments on posts, including
 * - adding comments and replies
 * - liking/unliking comments
 * - subscribing to comment updates in real-time
 */
import { db, auth } from "../firebase/fbconfig";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove, getDocs } from "firebase/firestore";

// Define the comment format
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  parentCommentId: string | null;
  likes: number;
  likedBy: string[];
  timestamp: any;
}

// Add a comment (or reply) to a post, incrementing commentCount
export const addComment = async (
  postId: string,
  text: string,
  parentCommentId: string | null = null
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to comment");

  const commentData = {
    postId,
    userId: user.uid,
    userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
    userEmail: user.email,
    text,
    parentCommentId,
    likes: 0,
    likedBy: [],
    timestamp: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "comments"), commentData);

  // Increment comment count on post
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      commentCount: increment(1),
    });
  } catch (err) {
    console.warn("Could not update comment count:", err);
  }

  return docRef.id;
};

// Subscribe to comments for a post (real-time updates), unsubscribe function for cleanup
export const subscribeToComments = (
  postId: string,
  callback: (comments: Comment[]) => void
) => {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];

    callback(comments);
  });
};


// Toggle like on a comment, prevent duplicates with array functions
export const toggleCommentLike = async (
  commentId: string,
  currentlyLiked: boolean
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to like");

  const commentRef = doc(db, "comments", commentId);

  if (currentlyLiked) {
    // Unlike
    await updateDoc(commentRef, {
      likes: increment(-1),
      likedBy: arrayRemove(user.uid),
    });
  } else {
    // Like
    await updateDoc(commentRef, {
      likes: increment(1),
      likedBy: arrayUnion(user.uid),
    });
  }
};

// Get all comments for a post (one-time fetch)
export const getComments = async (postId: string): Promise<Comment[]> => {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Comment[];
};