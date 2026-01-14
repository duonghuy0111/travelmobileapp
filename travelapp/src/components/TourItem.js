import moment from 'moment';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TourItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.location}>📍 {item.location}</Text>
                <View style={styles.row}>
                    <Text style={styles.price}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </Text>
                    <Text style={styles.date}>📅 {moment(item.start_date).format('DD/MM/YYYY')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: 'white', borderRadius: 10, marginBottom: 15, elevation: 3, marginHorizontal: 10, overflow: 'hidden' },
    image: { width: '100%', height: 150 },
    info: { padding: 10 },
    title: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
    location: { color: 'gray', fontSize: 12, marginBottom: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    price: { color: '#d9534f', fontWeight: 'bold' },
    date: { fontSize: 12, color: '#333' }
});

export default TourItem;