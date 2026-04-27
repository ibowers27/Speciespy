/**
 * Service for managing  (CRUD) in the app, including:
 * - Fetching posts (real-time  subscriptions and one-time fetches)
 * - Deleting posts (with image and comment cleanup cascade)
 * - Post data structure definition
 */
import { auth, db, storage } from "../firebase/fbconfig";
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc, deleteDoc, updateDoc, where } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

// Define the post format
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  imageUrl: string;
  scientificName: string;
  commonName: string;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  timestamp: any;
  likes: number;
  commentCount: number;
}

// Subscribe to all posts (real-time feed), unsubscribe for cleanup
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    callback(posts);
  });
};

// Get all posts (one-time fetch)
export const getPosts = async (): Promise<Post[]> => {
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];
};

// Get a single post by ID
export const getPost = async (postId: string): Promise<Post | null> => {
  const docRef = doc(db, "posts", postId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Post;
  }

  return null;
};

// Delete a post (with comments and image cleanup)
export const deletePost = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Verify ownership
  const post = await getPost(postId);
  if (!post) throw new Error('Post not found');
  
  if (post.userId !== user.uid) {
    throw new Error('You can only delete your own posts');
  }

  // Delete all comments associated with this post
  const commentsQuery = query(
    collection(db, 'comments'),
    where('postId', '==', postId)
  );
  const commentsSnapshot = await getDocs(commentsQuery);
  
  const deleteCommentPromises = commentsSnapshot.docs.map((commentDoc) =>
    deleteDoc(doc(db, 'comments', commentDoc.id))
  );
  await Promise.all(deleteCommentPromises);

  // Delete the image from Firebase Storage
  try {
    const imageRef = ref(storage, post.imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.log('Image deletion error (might already be deleted):', error);
  }

  // Finally, delete the post document
  await deleteDoc(doc(db, 'posts', postId));
};