import firestore from '@react-native-firebase/firestore';

const postsCollection = firestore().collection('posts');

export function createPost({user, photoURL,title, description}) {
  return postsCollection.add({
    user,
    photoURL,
    title,
    description,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function getPosts() {
    const snapshot = await postsCollection.get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return posts;
  }