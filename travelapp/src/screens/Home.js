import { Ionicons } from '@expo/vector-icons'; // Để dùng icon bộ lọc
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, FlatList,
    Modal,
    ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import API, { endpoints } from '../api/APIs';
import TourItem from '../components/TourItem';

const Home = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState(""); 
    const [cateId, setCateId] = useState(""); 

    const [modalVisible, setModalVisible] = useState(false); // Ẩn/hiện bộ lọc
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [tempFilter, setTempFilter] = useState({ min: "", max: "", loc: "" });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const resCates = await API.get(endpoints.categories);
                setCategories(resCates.data.results || resCates.data);

                let url = `${endpoints.services}?q=${q}`;
                if (cateId) url += `&category_id=${cateId}`;
                if (minPrice) url += `&min_price=${minPrice}`;
                if (maxPrice) url += `&max_price=${maxPrice}`;
                if (locationInput) url += `&location=${locationInput}`;
                
                console.log("Calling API:", url); // Log để kiểm tra
                
                const resServices = await API.get(url);
                setServices(resServices.data.results || resServices.data);
            } catch (ex) {
                console.error("Lỗi Home:", ex);
            } finally {
                setLoading(false);
            }
        };
       fetchData();
    }, [q, cateId, minPrice, maxPrice, locationInput]);
    const openFilter = () => {
        setTempFilter({ min: minPrice, max: maxPrice, loc: locationInput });
        setModalVisible(true);
    }

    // Hàm áp dụng bộ lọc
    const applyFilter = () => {
        setMinPrice(tempFilter.min);
        setMaxPrice(tempFilter.max);
        setLocationInput(tempFilter.loc);
        setModalVisible(false); // Đóng modal, useEffect sẽ tự chạy lại fetchData
    }

   return (
        <View style={styles.container}>
            {/* Thanh tìm kiếm + Nút Filter */}
            <View style={styles.headerRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="gray" style={{marginRight: 5}} />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Tìm kiếm tour..." 
                        value={q} 
                        onChangeText={setQ} 
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
                    <Ionicons name="options" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Danh mục (Giữ nguyên code cũ của bạn) */}
            <View style={{ height: 50 }}>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cateScroll}>
                    <TouchableOpacity onPress={() => setCateId("")} style={[styles.cateItem, cateId === "" ? styles.activeCate : null]}>
                        <Text style={cateId === "" ? styles.activeText : styles.text}>Tất cả</Text>
                    </TouchableOpacity>
                    {categories.map(c => (
                        <TouchableOpacity key={c.id} onPress={() => setCateId(c.id)} style={[styles.cateItem, cateId === c.id ? styles.activeCate : null]}>
                            <Text style={cateId === c.id ? styles.activeText : styles.text}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Danh sách Tour */}
            {loading ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}} /> : (
                <FlatList
                    data={services}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <TourItem 
                            item={item} 
                            onPress={() => navigation.navigate("TourDetail", { tourId: item.id })} 
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: 'gray'}}>Không tìm thấy tour nào.</Text>}
                />
            )}

            {/* --- MODAL BỘ LỌC CHI TIẾT --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
                        
                        <Text style={styles.label}>Địa điểm:</Text>
                        <TextInput 
                            style={styles.modalInput} 
                            placeholder="VD: Đà Nẵng, Sa Pa..." 
                            value={tempFilter.loc}
                            onChangeText={(t) => setTempFilter({...tempFilter, loc: t})}
                        />

                        <Text style={styles.label}>Khoảng giá (VND):</Text>
                        <View style={styles.priceRow}>
                            <TextInput 
                                style={[styles.modalInput, {flex: 1}]} 
                                placeholder="Tối thiểu" 
                                keyboardType="numeric"
                                value={tempFilter.min}
                                onChangeText={(t) => setTempFilter({...tempFilter, min: t})}
                            />
                            <Text style={{marginHorizontal: 10}}>-</Text>
                            <TextInput 
                                style={[styles.modalInput, {flex: 1}]} 
                                placeholder="Tối đa" 
                                keyboardType="numeric"
                                value={tempFilter.max}
                                onChangeText={(t) => setTempFilter({...tempFilter, max: t})}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc'}]} onPress={() => setModalVisible(false)}>
                                <Text>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btn} onPress={applyFilter}>
                                <Text style={{color: 'white', fontWeight: 'bold'}}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    
    // Header mới
    headerRow: { flexDirection: 'row', padding: 10, alignItems: 'center', backgroundColor: 'white' },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', paddingHorizontal: 10, borderRadius: 8, height: 40 },
    input: { flex: 1, marginLeft: 5 },
    filterBtn: { marginLeft: 10, backgroundColor: '#007AFF', padding: 8, borderRadius: 8 },

    // Cate (Giữ nguyên style cũ của bạn)
    cateScroll: { paddingHorizontal: 10, alignItems: 'center', paddingVertical: 10 },
    cateItem: { paddingHorizontal: 15, paddingVertical: 6, marginRight: 10, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd' },
    activeCate: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    text: { color: 'black' },
    activeText: { color: 'white', fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, backgroundColor: '#f9f9f9' },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
    btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#007AFF' }
});

export default Home;