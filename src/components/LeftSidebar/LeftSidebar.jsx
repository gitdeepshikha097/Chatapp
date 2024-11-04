import React, { useContext, useEffect, useState } from 'react';
import './LeftSidebar.css';
import { useNavigate } from 'react-router-dom';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import assets from '../../assets/assets';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { userData, chatData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // Handle search input and fetch users based on input
  const inputHandler = async (e) => {
    const input = e.target.value.trim().toLowerCase();
    if (!input) {
      setShowSearch(false);
      return;
    }
    try {
      setShowSearch(true);
      const userRef = collection(db, 'users');
      const q = query(userRef, where("username", ">=", input), where("username", "<=", input + '\uf8ff'));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const fetchedUser = querySnap.docs[0].data();
        // Check if the fetched user is not the current user and not already in chatData
        if (fetchedUser.id !== userData.id) {
          const userExistsInChat = chatData.some((chat) => chat.rId === fetchedUser.id);
          if (!userExistsInChat) {
            setUser(fetchedUser);
          } else {
            setUser(null); // User already in chatData, don't display
          }
        } else {
          setUser(null); // Current user, don't display
        }
      } else {
        setUser(null); // No user found
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
      toast.error("An error occurred while fetching data.");
    }
  };

  // Add a new chat
  const addChat = async () => {
    if (!user) return;
    const messagesRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");

    try {
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        messages: []
      });

      await updateDoc(doc(chatsRef, user.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updateAt: Date.now(),
          messageSeen: true
        })
      });

      await updateDoc(doc(chatsRef, userData.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updateAt: Date.now(),
          messageSeen: true
        })
      });

      const uSnap = await getDoc(doc(db, "users", user.id));
      const uData = uSnap.data();

      setChatUser({
        messagesId: newMessageRef.id,
        lastMessage: "",
        rId: user.id,
        updateAt: Date.now(),
        messageSeen: true,
        userData: uData
      });
      setShowSearch(false);
      setChatVisible(true);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  // Set the current chat
  const setChat = async (item) => {
    setMessagesId(item.messageId);
    setChatUser(item);

    try {
      const userChatsRef = doc(db, 'chats', userData.id);
      const userChatSnapshot = await getDoc(userChatsRef);
      const userChatsData = userChatSnapshot.data();

      const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
      if (chatIndex !== -1) {
        userChatsData.chatsData[chatIndex].messageSeen = true;
        await updateDoc(userChatsRef, {
          chatsData: userChatsData.chatsData
        });
      }
      setChatVisible(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Filter out duplicate chats based on rId
  const uniqueChats = chatData.reduce((acc, current) => {
    const x = acc.find(item => item.rId === current.rId);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  // Update chat user data on every chatData update
  useEffect(() => {
    const updateChatUserData = async () => {
      if (chatUser) {
        const userRef = doc(db, "users", chatUser.userData.id);
        const userSnap = await getDoc(userRef);
        const updatedUserData = userSnap.data();

        setChatUser((prev) => ({ ...prev, userData: updatedUserData }));
      }
    };
    updateChatUserData();
  }, [chatData]);

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          {/* Display user's profile image and name */}
          <div className="user-info">
            <img src={userData?.avatar} alt="User Avatar" className="user-avatar" />
            <p className="user-name">{userData?.name}</p>
          </div>
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input onChange={inputHandler} type="text" placeholder='Search here..' />
        </div>
      </div>
      <div className="ls-list">
        {showSearch && user ? 
          <div onClick={addChat} className='friends add-user'>
            <img src={user.avatar} alt="" />
            <p>{user.name}</p>
          </div>
         : uniqueChats.map((item, index) => (
            <div
              key={item.messageId}
              onClick={() => setChat(item)}
              className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}
            >
              <img src={item.userData.avatar} alt="" />
              <div>
                <p>{item.userData.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default LeftSidebar;
