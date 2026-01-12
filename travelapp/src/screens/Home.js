import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import API, { endpoints } from '../api/APIs';
import TourItem from '../components/TourItem'; 

const Home = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState(""); 
    const [cateId, setCateId] = useState(""); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resCates = await API.get(endpoints.categories);
                setCategories(resCates.data.results || resCates.data);

                let url = `${endpoints.services}?q=${q}`;
                if (cateId) url += `&category_id=${cateId}`;
                
                const resServices = await API.get(url);
                setServices(resServices.data.results || resServices.data);
            } catch (ex) {
                console.error("Lỗi Home:", ex);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [q, cateId]);

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Tìm kiếm tour..." 
                    onChangeText={t => setQ(t)} 
                />
            </View>

            <View style={{ height: 50, marginBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cateScroll}>
                    <TouchableOpacity onPress={() => setCateId("")} style={[styles.cateItem, cateId === "" && styles.activeCate]}>
                        <Text style={cateId === "" ? styles.activeText : styles.text}>Tất cả</Text>
                    </TouchableOpacity>
                    {categories.map(c => (
                        <TouchableOpacity key={c.id} onPress={() => setCateId(c.id)} style={[styles.cateItem, cateId === c.id && styles.activeCate]}>
                            <Text style={cateId === c.id ? styles.activeText : styles.text}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

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
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    searchBox: { padding: 10, backgroundColor: 'white', marginBottom: 5 },
    input: { backgroundColor: '#eee', padding: 10, borderRadius: 8 },
    cateScroll: { paddingHorizontal: 10, alignItems: 'center' },
    cateItem: { paddingHorizontal: 15, paddingVertical: 6, marginRight: 10, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd' },
    activeCate: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    text: { color: 'black' },
    activeText: { color: 'white', fontWeight: 'bold' },
});

export default Home;