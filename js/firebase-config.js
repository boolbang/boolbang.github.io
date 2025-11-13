// Firebase 설정 파일
//
// ⚠️ 보안 참고사항:
// - Firebase API 키는 클라이언트 사이드 사용을 위해 설계되었으며, 공개되어도 안전합니다
// - 실제 보안은 Firebase Console의 Security Rules에서 관리됩니다
// - Firestore Rules에서 읽기/쓰기 권한을 적절히 설정하세요
// - Authentication으로 관리자 기능을 보호하고 있습니다
//
// 참고: https://firebase.google.com/docs/projects/api-keys

export const firebaseConfig = {
  apiKey: "AIzaSyCqAQCELh1q2pWxrXtx-8lBwRe2CTSG_HdQ",
  authDomain: "boolbang-board.firebaseapp.com",
  projectId: "boolbang-board",
  storageBucket: "boolbang-board.appspot.com",
  messagingSenderId: "1563061617526",
  appId: "1:1563061617526:web:066768f311fc53cd017257",
  measurementId: "G-2CBKFZ5Q85",
};

// Firebase 버전 통일: 10.12.0 사용
export const FIREBASE_VERSION = "10.12.0";
