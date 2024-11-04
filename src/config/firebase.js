import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword,getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut} from "firebase/auth";
import { getFirestore, setDoc, doc, collection, query, where, getDoc, getDocs } from "firebase/firestore";
import { toast } from 'react-toastify'; 
const firebaseConfig = {
  apiKey: "AIzaSyBA7b5pS2sbGDRjqXXSfnP4qxSWvQs8M4k",
  authDomain: "chatapp-bf07b.firebaseapp.com",
  projectId: "chatapp-bf07b",
  storageBucket: "chatapp-bf07b.appspot.com",
  messagingSenderId: "362907888368",
  appId: "1:362907888368:web:c88f314f4e537b6488b035"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async(username,email,password) =>{
   try {
    console.log("Before signing up...");
      const res = await createUserWithEmailAndPassword(auth,email,password);
      console.log("User signed up:", res);
      const user = res.user;
      await setDoc(doc(db,"users",user.uid),{
        id:user.uid,
        username:username.toLowerCase(),
        email,
        name:"",
        avatar:"",
        bio:"Hey There i am using chat app",
        lastSeen:Date.now()
      })
      await setDoc(doc(db,"chats",user.uid),{
        chatsData:[]
      })
   } catch (error) {
    console.error(error)
    toast.error(error.code.split('/')[1].split('-').join(" "));
   }
}
const login = async (email,password) => {
  try {
      await signInWithEmailAndPassword(auth,email,password);
  } catch (error) {
      console.error(error);
      toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}

const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error);
      toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}

const resetPass = async (email) => {
  if(!email){
    toast.error("Enter your email");
    return null;
  }
  try {
    const userRef = collection(db,'users');
    const q = query(userRef,where("email","==",email));
    const querySnap =await getDocs(q);
    if (!querySnap.empty) {
       await sendPasswordResetEmail(auth,email);
       toast.success("Reset Email Sent")
    }
    else {
      toast.error("Email doesn't exists")
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message)
  }
}
export { auth, db, signup, login, logout, resetPass };