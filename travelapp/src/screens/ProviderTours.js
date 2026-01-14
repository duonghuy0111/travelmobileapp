import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Quan trọng: Để reload khi quay lại
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import API, { authApi, endpoints } from '../api/APIs';
import { MyUserContext } from '../context/MyUserContext';

const ProviderTours = ({ navigation }) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user] = useContext(MyUserContext);

    // Hàm load danh sách tour
    const loadMyTours = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("access-token");
            // Gọi API lấy danh sách services
            // Lưu ý: Nếu Backend đã lọc sẵn theo user thì tốt. 
            // Nếu không, ta lọc client-side như bên dưới:
            const res = await API.get(endpoints['services']);
            const allTours = res.data.results || res.data;
            
            // 2. Lọc thông minh (Fix lỗi không hiện tour)
            const myTours = allTours.filter(t => {
                // Lấy ID của người tạo tour từ phản hồi API
                // (Xử lý cả trường hợp provider là số ID hoặc là Object user)
                const tourProviderId = t.provider?.id || t.provider; 

                // So sánh lỏng (==) để "5" vẫn bằng 5
                return tourProviderId == user.id;
            });
            
            setTours(myTours);
        } catch (ex) {
            console.error("Lỗi load tour:", ex);
            Alert.alert("Lỗi", "Không tải được danh sách tour.");
        } finally {
            setLoading(false);
        }
    };

    // useFocusEffect: Chạy mỗi khi màn hình này được focus (VD: Quay lại từ màn hình Thêm Tour)
    useFocusEffect(
        useCallback(() => {
            loadMyTours();
        }, [])
    );

    // Hàm xóa tour
    const handleDelete = (tourId) => {
        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc muốn xóa tour này vĩnh viễn không?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xóa", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("access-token");
                            await authApi(token).delete(`${endpoints['services']}${tourId}/`);
                            Alert.alert("Thành công", "Đã xóa tour!");
                            loadMyTours(); // Load lại danh sách ngay
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Thất bại", "Không thể xóa (Có thể tour này đã có người đặt vé).");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                </Text>
                <Text style={styles.subInfo}>📍 {item.location}</Text>
                
                <View style={styles.actions}>
                    {/* Nút Xóa */}
                    <TouchableOpacity 
                        style={[styles.btn, { backgroundColor: '#ffebee' }]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Text style={{color:'#d32f2f', fontWeight: 'bold'}}>🗑 Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>📦 Kho Tour của tôi</Text>
                <Text style={{color: 'gray'}}>{tours.length} tours</Text>
            </View>
            
            {loading ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} /> : (
                <FlatList 
                    data={tours}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{paddingBottom: 80}}
                    ListEmptyComponent={
                        <View style={{alignItems: 'center', marginTop: 50}}>
                            <Ionicons name="cube-outline" size={50} color="#ccc" />
                            <Text style={{color: 'gray', marginTop: 10}}>Bạn chưa đăng tour nào.</Text>
                        </View>
                    }
                />
            )}
            
            {/* Nút FAB để thêm Tour mới - Chuyển sang màn hình TourForm */}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => navigation.navigate("TourForm")}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    
    item: { flexDirection: 'row', backgroundColor: 'white', marginBottom: 15, borderRadius: 12, overflow: 'hidden', elevation: 3, padding: 10 },
    image: { width: 90, height: 90, borderRadius: 8 },
    info: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
    title: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    price: { color: '#d9534f', fontWeight: 'bold', fontSize: 15 },
    subInfo: { color: 'gray', fontSize: 12 },
    
    actions: { flexDirection: 'row', alignSelf: 'flex-end', marginTop: 5 },
    btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    
    fab: { 
        position: 'absolute', bottom: 20, right: 20, 
        backgroundColor: '#007AFF', width: 60, height: 60, 
        borderRadius: 30, justifyContent: 'center', alignItems: 'center', 
        elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3
    }
});

export default ProviderTours;