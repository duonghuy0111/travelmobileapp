import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // 👇 Import quan trọng này
import moment from 'moment';
import { useCallback, useState } from 'react'; // Thêm useCallback
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { authApi, endpoints } from '../api/APIs';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // 👇 Thay useEffect bằng useFocusEffect
    useFocusEffect(
        useCallback(() => {
            const loadBookings = async () => {
                // Đặt loading true mỗi khi vào lại màn hình để user biết đang tải
                setLoading(true); 
                try {
                    const token = await AsyncStorage.getItem("access-token");
                    const res = await authApi(token).get(endpoints.bookings);
                    
                    // 👇 Kiểm tra log để xem dữ liệu server trả về (Debug)
                    console.log("Bookings Data:", res.data);

                    // 👇 Xử lý trường hợp API trả về có phân trang (res.data.results) hoặc không
                    setBookings(res.data.results || res.data);
                } catch (ex) {
                    console.error("Lỗi tải lịch sử:", ex);
                } finally {
                    setLoading(false);
                }
            };
            
            loadBookings();
        }, [])
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.id}>Mã vé: #{item.id}</Text>
                <Text style={styles.date}>
                    {item.created_date ? moment(item.created_date).format("DD/MM/YYYY HH:mm") : "Vừa xong"}
                </Text>
            </View>
            
            <View style={styles.infoContainer}>
                {/* Nếu API trả về object service thì lấy name, nếu chỉ trả về ID thì hiện ID */}
                <Text style={styles.serviceName}>
                    Tour: {item.service?.name || item.service || "Chưa cập nhật tên"}
                </Text> 
                <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>
            </View>

            <View style={styles.statusContainer}>
                <Text style={styles.status}>✅ Đã ghi nhận</Text>
                {/* Format giá tiền nếu có */}
                {item.price && (
                     <Text style={styles.price}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                     </Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Danh sách vé đã đặt</Text>
            
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : bookings.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.empty}>Bạn chưa đặt tour nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    
    card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderColor: '#f0f0f0', paddingBottom: 8 },
    id: { fontWeight: 'bold', color: '#666' },
    date: { color: 'gray', fontSize: 12 },
    
    infoContainer: { marginBottom: 10 },
    serviceName: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
    quantity: { fontSize: 15, color: '#444' },

    statusContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    status: { color: 'green', fontWeight: 'bold', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
    price: { fontWeight: 'bold', color: '#d32f2f', fontSize: 16 },
    
    empty: { fontSize: 16, color: 'gray' }
});

export default MyBookings;