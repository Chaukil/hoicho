// Import các module Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBLOOdQQVkOrLTzxaMms96ycTU-iHq-Hak",
    authDomain: "quan-ly-hoi-cho-game.firebaseapp.com",
    projectId: "quan-ly-hoi-cho-game",
    storageBucket: "quan-ly-hoi-cho-game.firebasestorage.app",
    messagingSenderId: "231573095754",
    appId: "1:231573095754:web:5ba226f9915c3640a62db3",
    measurementId: "G-NT87ZVNPGF"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Các hàm hỗ trợ Firestore
const firebaseDB = {
    // Tham chiếu collection
    collection: (collectionName) => ({
        // Thêm tài liệu
        add: async (data) => {
            try {
                const docRef = await addDoc(collection(db, collectionName), data);
                return docRef;
            } catch (error) {
                console.error('Lỗi khi thêm tài liệu:', error);
                throw error;
            }
        },

        // Lấy tất cả tài liệu
        get: async () => {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                return querySnapshot;
            } catch (error) {
                console.error('Lỗi khi lấy tài liệu:', error);
                throw error;
            }
        },

        // Lấy tài liệu có sắp xếp
        orderBy: (field, direction = 'asc') => ({
            get: async () => {
                try {
                    const q = query(collection(db, collectionName), orderBy(field, direction));
                    const querySnapshot = await getDocs(q);
                    return querySnapshot;
                } catch (error) {
                    console.error('Lỗi khi lấy tài liệu có sắp xếp:', error);
                    throw error;
                }
            }
        }),

        // Lấy tài liệu có điều kiện where
        where: (field, operator, value) => ({
            get: async () => {
                try {
                    const q = query(collection(db, collectionName), where(field, operator, value));
                    const querySnapshot = await getDocs(q);
                    return querySnapshot;
                } catch (error) {
                    console.error('Lỗi khi lấy tài liệu có lọc:', error);
                    throw error;
                }
            }
        }),

        // Tham chiếu tài liệu
        doc: (docId) => ({
            // Cập nhật tài liệu
            update: async (data) => {
                try {
                    const docRef = doc(db, collectionName, docId);
                    await updateDoc(docRef, data);
                    return docRef;
                } catch (error) {
                    console.error('Lỗi khi cập nhật tài liệu:', error);
                    throw error;
                }
            },

            // Xóa tài liệu
            delete: async () => {
                try {
                    const docRef = doc(db, collectionName, docId);
                    await deleteDoc(docRef);
                    return docRef;
                } catch (error) {
                    console.error('Lỗi khi xóa tài liệu:', error);
                    throw error;
                }
            }
        })
    })
};

// Làm cho firebaseDB có thể truy cập toàn cục
window.firebaseDB = firebaseDB;

// Kiểm tra kết nối
async function testConnection() {
    try {
        console.log('Đang kiểm tra kết nối Firebase...');
        const testCollection = firebaseDB.collection('test');
        await testCollection.get();
        console.log('Kết nối Firebase thành công!');
    } catch (error) {
        console.error('Kết nối Firebase thất bại:', error);
    }
}

// Khởi tạo kết nối khi DOM được tải
document.addEventListener('DOMContentLoaded', () => {
    testConnection();
});

export { firebaseDB };
