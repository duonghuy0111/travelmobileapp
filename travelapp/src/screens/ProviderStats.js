import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authApi, endpoints } from '../api/APIs';

// Component con để hiển thị từng thẻ thống kê
const StatCard = ({ icon, title, value, subText, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="white" />
        </View>
        <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardValue}>{value}</Text>
            {subText && <Text style={styles.subText}>{subText}</Text>}
        </View>
    </View>
);

const ProviderStats = () => {
    const [stats, setStats] = useState({ revenue: 0, count: 0, customers: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        try {
            const token = await AsyncStorage.getItem("access-token");
            // Gọi API Booking (Backend phải trả về list booking của Provider này)
            const res = await authApi(token).get(endpoints['bookings']);
            
            const myOrders = res.data.results || res.data;
            
            // 1. Tính tổng doanh thu (Cộng dồn total_price)
            const totalRevenue = myOrders.reduce((total, order) => {
                return total + (parseFloat(order.total_price) || 0);
            }, 0);

            // 2. Đếm số khách (Lọc trùng lặp user id nếu cần, ở đây đếm tổng đơn)
            const totalOrders = myOrders.length;

            setStats({
                revenue: totalRevenue,
                count: totalOrders,
                customers: totalOrders // Tạm thời số khách = số đơn
            });

        } catch (ex) {
            console.error("Lỗi Stats:", ex);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load lần đầu
    useEffect(() => { loadStats(); }, []);

    // Hàm Refresh (Kéo xuống để làm mới)
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadStats();
    }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />}
        >
            <View style={styles.headerContainer}>
                <Text style={styles.header}>📊 Thống kê kinh doanh</Text>
                <Text style={styles.subHeader}>Tổng quan hiệu quả hoạt động</Text>
            </View>
            
            <View style={styles.grid}>
                {/* Doanh thu */}
                <StatCard 
                    icon="cash" 
                    title="Tổng doanh thu" 
                    value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
                    subText="Doanh thu tạm tính"
                    color="#4CAF50" // Xanh lá
                />
                
                {/* Số đơn hàng */}
                <StatCard 
                    icon="receipt" 
                    title="Đơn đặt vé" 
                    value={`${stats.count} đơn`}
                    subText="Số lượng giao dịch thành công"
                    color="#FF9800" // Cam
                />

                {/* Số khách (Ví dụ mở rộng) */}
                <StatCard 
                    icon="people" 
                    title="Khách hàng" 
                    value={`${stats.customers} người`}
                    subText="Tổng lượt khách phục vụ"
                    color="#2196F3" // Xanh dương
                />
            </View>

            {/* Phần thông báo / Lời khuyên */}
            <View style={styles.noticeBox}>
                <View style={styles.noticeHeader}>
                    <Ionicons name="bulb" size={20} color="#FBC02D" />
                    <Text style={styles.noticeTitle}> Mẹo tăng trưởng</Text>
                </View>
                <Text style={styles.noticeText}>
                    Hãy cập nhật hình ảnh Tour đẹp hơn và phản hồi khách hàng nhanh chóng để tăng 20% doanh thu tháng này!
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f4f6f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    headerContainer: { marginBottom: 25, marginTop: 20 },
    header: { fontSize: 26, fontWeight: 'bold', color: '#333' },
    subHeader: { color: 'gray', fontSize: 14, marginTop: 5 },
    
    grid: { gap: 15 },
    card: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', 
        padding: 20, borderRadius: 12, elevation: 4, 
        borderLeftWidth: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2}
    },
    iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardTitle: { color: 'gray', fontSize: 14, marginBottom: 5 },
    cardValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    subText: { fontSize: 11, color: '#888', marginTop: 3, fontStyle: 'italic' },
    
    noticeBox: { marginTop: 30, backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    noticeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    noticeTitle: { fontWeight: 'bold', color: '#333', fontSize: 16 },
    noticeText: { lineHeight: 22, color: '#555' }
});

export default ProviderStats;