import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { authApi, endpoints } from '../api/APIs';

const ProviderOrders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const token = await AsyncStorage.getItem("access-token");
                // Backend cần xử lý: Nếu là Provider thì trả về list booking của provider đó
                const res = await authApi(token).get(endpoints['bookings']);
                setOrders(res.data.results || res.data);
            } catch (ex) {
                console.error(ex);
            }
        };
        loadOrders();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.id}>Đơn #{item.id}</Text>
                <Text style={styles.date}>{moment(item.created_date).format("DD/MM/YYYY HH:mm")}</Text>
            </View>
            <Text style={styles.customer}>👤 Khách: {item.user?.username || "Khách hàng"}</Text>
            <Text style={styles.tourName}>🏖 {item.service?.name || "Tên Tour"}</Text>
            <Text style={styles.total}>💰 Tổng tiền: {item.total_price || 0} VNĐ</Text>
            
            {/* Trạng thái đơn hàng */}
            <View style={styles.statusBadge}>
                <Text style={{color: 'green', fontWeight: 'bold'}}>✅ Đã thanh toán</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🛒 Đơn hàng khách đặt</Text>
            <FlatList 
                data={orders}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5 },
    id: { fontWeight: 'bold', color: '#555' },
    date: { color: 'gray', fontSize: 12 },
    customer: { fontSize: 16, marginTop: 5 },
    tourName: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginVertical: 5 },
    total: { fontSize: 16, color: '#d9534f', fontWeight: 'bold' },
    statusBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f5e9', padding: 5, borderRadius: 5, marginTop: 10 }
});

export default ProviderOrders;