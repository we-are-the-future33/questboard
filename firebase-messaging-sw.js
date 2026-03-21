// firebase-messaging-sw.js
// 이 파일은 프로젝트 루트(index.html과 같은 위치)에 배치

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAbEbLdJuWVai_NKTHuo1XtC8p76dmVPE0",
  authDomain: "grow-goal.firebaseapp.com",
  databaseURL: "https://grow-goal-default-rtdb.firebaseio.com",
  projectId: "grow-goal",
  storageBucket: "grow-goal.firebasestorage.app",
  messagingSenderId: "587441793315",
  appId: "1:587441793315:web:8ae5325a2af90953ce4496"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '🐹 키웁', {
    body: body || '알림이 도착했어요!',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  });
});
