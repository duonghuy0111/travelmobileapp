import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import API, { authApi, CLIENT_ID, CLIENT_SECRET, endpoints } from '../api/APIs'; // Nhớ export CLIENT_ID từ APIs.js
import { MyUserContext } from '../context/MyUserContext';

const Login = ({ navigation, route }) => { // 👇 Thêm route để nhận tham số
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, dispatch] = useContext(MyUserContext);

    // Lấy tham số được gửi từ TourDetail (nếu có)
    const params = route.params || {};

    const login = async () => {
        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('client_id', CLIENT_ID); // Đảm bảo biến này đúng
            formData.append('client_secret', CLIENT_SECRET);
            formData.append('grant_type', 'password');

            let res = await API.post(endpoints['login'], formData.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            await AsyncStorage.setItem("access-token", res.data.access_token);
            let userRes = await authApi(res.data.access_token).get(endpoints['current-user']);
            
            console.log("🔥 CHECK SERVER TRẢ VỀ:", JSON.stringify(userRes.data, null, 2));

            dispatch({
                type: "login",
                payload: userRes.data
            });

            // 👇 LOGIC ĐIỀU HƯỚNG THÔNG MINH
            if (params.previousScreen === "TourDetail") {
                // Nếu đến từ trang Chi tiết Tour, thì quay lại đó kèm theo tourId
                navigation.navigate("Home", { 
                    screen: "HomeTab", 
                    params: { 
                        screen: "TourDetail", 
                        params: { tourId: params.tourId } 
                    }
                });
            } else {
                // Nếu đăng nhập bình thường thì về Home
                navigation.navigate("Home");
            }

        } catch (ex) {
            console.error(ex);
            Alert.alert("Lỗi", "Tên đăng nhập hoặc mật khẩu không đúng!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ĐĂNG NHẬP</Text>
            <TextInput 
                style={styles.input} placeholder="Tên đăng nhập" 
                value={username} onChangeText={setUsername} 
            />
            <TextInput 
                style={styles.input} placeholder="Mật khẩu" secureTextEntry 
                value={password} onChangeText={setPassword} 
            />
            
            {loading ? <ActivityIndicator size="large" color="#007AFF" /> : (
                <TouchableOpacity style={styles.btn} onPress={login}>
                    <Text style={styles.btnText}>Đăng nhập</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
    input: { height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, borderRadius: 8 },
    btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    link: { marginTop: 20, textAlign: 'center', color: '#007AFF' }
});

export default Login;