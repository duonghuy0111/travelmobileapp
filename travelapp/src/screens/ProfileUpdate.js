import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authApi, endpoints } from '../api/APIs';
import { MyUserContext } from '../context/MyUserContext';

const ProfileUpdate = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);
    const [firstName, setFirstName] = useState(user.first_name);
    const [lastName, setLastName] = useState(user.last_name);
    const [email, setEmail] = useState(user.email);
    const [avatar, setAvatar] = useState(null); // Lưu file ảnh mới chọn
    const [loading, setLoading] = useState(false);

    // Hàm chọn ảnh từ thư viện
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0]);
        }
    };

    const updateProfile = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("access-token");
            
            // Dùng FormData để gửi cả text và file ảnh
            const formData = new FormData();
            formData.append("first_name", firstName);
            formData.append("last_name", lastName);
            formData.append("email", email);

            // Nếu có chọn ảnh mới thì mới gửi lên
            if (avatar) {
                formData.append("avatar", {
                    uri: avatar.uri,
                    name: avatar.fileName || "avatar.jpg",
                    type: "image/jpeg"
                });
            }

            // Gọi API PATCH để cập nhật
            const res = await authApi(token).patch(endpoints['current-user'], formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            // Cập nhật lại Context (để màn hình Profile tự đổi theo)
            dispatch({
                type: "login",
                payload: res.data
            });

            Alert.alert("Thành công", "Cập nhật thông tin thành công!");
            navigation.goBack();

        } catch (ex) {
            console.error(ex);
            Alert.alert("Lỗi", "Cập nhật thất bại.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickImage}>
                    {/* Ưu tiên hiện ảnh mới chọn, nếu không thì hiện ảnh cũ */}
                    <Image 
                        source={{ uri: avatar ? avatar.uri : user.avatar }} 
                        style={styles.avatar} 
                    />
                    <Text style={styles.changeAvatarText}>Chạm để đổi ảnh</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Họ</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

                <Text style={styles.label}>Tên</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

                {loading ? <ActivityIndicator size="large" color="#007AFF" /> : (
                    <TouchableOpacity style={styles.btn} onPress={updateProfile}>
                        <Text style={styles.btnText}>LƯU THAY ĐỔI</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    avatarContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#ddd' },
    changeAvatarText: { marginTop: 10, color: '#007AFF', fontWeight: '500' },
    form: { padding: 20 },
    label: { fontSize: 16, color: '#666', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, fontSize: 16, backgroundColor: '#f9f9f9' },
    btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileUpdate;