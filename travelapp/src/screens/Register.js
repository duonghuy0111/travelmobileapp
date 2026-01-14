import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import API, { endpoints } from '../api/APIs';

const Register = ({ navigation }) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);

    // Hàm chọn ảnh
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

    const register = async () => {
        // 1. Validate cơ bản
        if (!username || !password || !confirmPassword || !firstName || !lastName) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);
        try {
            // 2. Tạo Form Data
            const formData = new FormData();
            formData.append("first_name", firstName);
            formData.append("last_name", lastName);
            formData.append("username", username);
            formData.append("password", password);
            formData.append("email", email);
            
            // Nếu có avatar thì gửi, không thì thôi (Backend nên set default)
            if (avatar) {
                formData.append("avatar", {
                    uri: avatar.uri,
                    name: avatar.fileName || "avatar.jpg",
                    type: "image/jpeg"
                });
            }

            // 3. Gọi API POST /users/
            await API.post(endpoints['register'], formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            // 4. Thành công
            Alert.alert("Thành công", "Tạo tài khoản thành công! Vui lòng đăng nhập.");
            navigation.navigate("Login");

        } catch (ex) {
            console.error(ex);
            // Kiểm tra lỗi từ server trả về (ví dụ: trùng username)
            if (ex.response && ex.response.status === 400) {
                Alert.alert("Lỗi", "Tên đăng nhập đã tồn tại hoặc dữ liệu không hợp lệ.");
            } else {
                Alert.alert("Lỗi", "Đăng ký thất bại. Vui lòng thử lại sau.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>Đăng Ký Thành Viên</Text>
                
                {/* Chọn Avatar */}
                <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                    {avatar ? (
                        <Image source={{ uri: avatar.uri }} style={styles.avatar} />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={{color: '#aaa'}}>Chọn ảnh</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Form Input */}
                <View style={styles.row}>
                    <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Họ" value={lastName} onChangeText={setLastName} />
                    <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Tên" value={firstName} onChangeText={setFirstName} />
                </View>

                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <TextInput style={styles.input} placeholder="Tên đăng nhập" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput style={styles.input} placeholder="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                {loading ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}} /> : (
                    <>
                        <TouchableOpacity style={styles.btnRegister} onPress={register}>
                            <Text style={styles.btnText}>ĐĂNG KÝ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.navigate("Login")}>
                            <Text style={{color: '#007AFF'}}>Đã có tài khoản? Đăng nhập</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333' },
    avatarContainer: { marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    placeholderAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    row: { flexDirection: 'row', width: '100%', marginBottom: 15 },
    input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#f9f9f9' },
    btnRegister: { width: '100%', height: 50, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default Register;