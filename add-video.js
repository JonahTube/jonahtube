import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIVGv1dkpCn6bKGstvbqDMHbPY9ce8tw8",
  authDomain: "jonahtube-bf9db.firebaseapp.com",
  projectId: "jonahtube-bf9db",
  storageBucket: "jonahtube-bf9db.appspot.com",
  messagingSenderId: "757825713276",
  appId: "1:757825713276:web:d755230351acd1159d45f9",
  measurementId: "G-NF5N10T4Q1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("videoForm");
const statusDiv = document.getElementById("status");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const youtubeUrl = document.getElementById("youtubeUrl").value.trim();

  if (!title || !description || !youtubeUrl) {
    statusDiv.textContent = "Please fill in all fields.";
    return;
  }

  const youtubeId = extractYouTubeID(youtubeUrl);
  if (!youtubeId) {
    statusDiv.textContent = "Invalid YouTube URL!";
    return;
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
  const videoEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;

  try {
    const channelDoc = doc(db, "channels", currentUser.uid);
    const channelSnap = await getDoc(channelDoc);
    if (!channelSnap.exists()) {
      statusDiv.textContent = "Channel does not exist.";
      return;
    }

    const videosCol = collection(channelDoc, "videos");
    await addDoc(videosCol, {
      title,
      description,
      youtubeUrl,
      embedUrl: videoEmbedUrl,
      thumbnailUrl,
      createdAt: new Date()
    });

    statusDiv.textContent = "✅ Video uploaded successfully!";
    form.reset();
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error uploading video.";
  }
});

function extractYouTubeID(url) {
  const regExp = /^.*(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}
