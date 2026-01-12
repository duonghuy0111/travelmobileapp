import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { MyUserContext } from '../context/MyUserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);

    // 👇 DEBUG: In ra để xem user đang chứa gì
    console.log("Dữ liệu User trong Profile:", user);

    const logout = async () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Đồng ý", 
                    onPress: async () => {
                        await AsyncStorage.removeItem("access-token");
                        dispatch({ type: "logout" });
                        navigation.navigate("Login");
                    }
                }
            ]
        );
    };

    if (user === null) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Vui lòng đăng nhập để xem hồ sơ!</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.btnLogin}>
                    <Text style={styles.btnText}>Đăng nhập ngay</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* 👇 Xử lý ảnh: Nếu user.avatar null thì dùng ảnh mặc định */}
                <Image 
                    source={{ uri: user.avatar ? user.avatar : 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg' }} 
                    style={styles.avatar} 
                />
                
                {/* 👇 Xử lý tên: Nếu username null thì hiện "User" */}
                <Text style={styles.username}>
                    {user.username || "Thành viên mới"}
                </Text>
                
                {/* 👇 Xử lý email: Nếu email null thì hiện thông báo */}
                <Text style={styles.email}>
                    {user.email || "Chưa cập nhật email"}
                </Text>
            </View>

            <TouchableOpacity 
                    style={styles.editBtn}
                    onPress={() => navigation.navigate("ProfileUpdate")}
                >
                    <Text style={styles.editBtnText}>✎ Chỉnh sửa</Text>
            </TouchableOpacity>

            <View style={styles.body}>
                <View style={styles.item}>
                    <Text style={styles.label}>Họ và tên:</Text>
                    {/* 👇 Kiểm tra cả họ và tên */}
                    <Text style={styles.value}>
                        {(user.last_name || user.first_name) 
                            ? `${user.last_name || ''} ${user.first_name || ''}` 
                            : "Chưa cập nhật tên"}
                    </Text>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MyBookings")}>
                    <Text style={styles.menuText}>🎫 Lịch sử đặt vé</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnLogout} onPress={logout}>
                    <Text style={styles.btnText}>ĐĂNG XUẤT</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // Chỉnh lại header cho đẹp hơn
    header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#e3f2fd', marginBottom: 10 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, borderWidth: 3, borderColor: 'white', backgroundColor: '#ccc' },
    username: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 16, color: '#666', marginTop: 4 },
    
    editBtn: { alignSelf: 'center', marginTop: -25, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1 },
    editBtnText: { color: '#007AFF', fontWeight: 'bold' },

    body: { padding: 20, marginTop: 10 },
    item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee' },
    label: { fontSize: 16, color: '#666' },
    value: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee', marginTop: 10 },
    menuText: { fontSize: 16, color: '#333', fontWeight: '500' },
    arrow: { fontSize: 20, color: '#999' },

    btnLogout: { marginTop: 40, backgroundColor: '#d32f2f', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnLogin: { marginTop: 10, backgroundColor: '#1976d2', padding: 10, borderRadius: 8 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    text: { fontSize: 18, color: '#666' }
});

export default Profile;