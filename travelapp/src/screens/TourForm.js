import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { authApi, endpoints } from '../api/APIs';
import { MyUserContext } from '../context/MyUserContext';

const TourForm = ({ route, navigation }) => {
    const [user] = useContext(MyUserContext);
    
    // Lấy tour từ màn hình danh sách truyền sang (nếu có)
    const tour = route.params?.tour || null; 
    const isEditMode = !!tour; // Nếu có tour thì là True (Chế độ sửa)

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('2024-06-01');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // 🟢 Nếu là chế độ sửa, đổ dữ liệu cũ vào các ô input
    useEffect(() => {
        if (isEditMode && tour) {
            setName(tour.name);
            setPrice(String(tour.price)); // Chuyển số thành chuỗi để hiển thị
            setLocation(tour.location);
            setCategoryId(String(tour.category_id || tour.category)); // Xử lý tùy backend trả về ID hay Object
            setDescription(tour.description);
            setStartDate(tour.start_date);
            // Không set image vì image là file, chỉ hiển thị ảnh cũ để xem thôi
        }
    }, [tour]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0]); // Lưu ảnh mới chọn
        }
    };

    const handleSubmit = async () => {
        if (!name || !price || !categoryId) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập các thông tin bắt buộc!");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("access-token");
            const formData = new FormData();

            // Thêm các trường text
            formData.append('name', name);
            formData.append('price', parseInt(price.replace(/[^0-9]/g, ''))); 
            formData.append('location', location);
            formData.append('category_id', parseInt(categoryId));
            formData.append('description', description);
            formData.append('start_date', startDate);
            formData.append('provider', user.id);

            // ⚠️ Xử lý ảnh thông minh:
            // Chỉ gửi ảnh lên nều người dùng CÓ CHỌN ẢNH MỚI
            if (image) {
                const filename = image.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('image', {
                    uri: image.uri,
                    name: filename,
                    type: type,
                });
            }

            let res;
            if (isEditMode) {
                // 👉 LOGIC CẬP NHẬT (PATCH)
                // Gọi API PATCH: /services/{id}/
                console.log("Đang cập nhật tour ID:", tour.id);
                res = await authApi(token).patch(`${endpoints['services']}${tour.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                Alert.alert("Thành công", "Đã cập nhật tour!");
            } else {
                // 👉 LOGIC THÊM MỚI (POST)
                console.log("Đang thêm mới...");
                res = await authApi(token).post(endpoints['services'], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                Alert.alert("Thành công", "Đã thêm tour mới!");
            }

            navigation.goBack(); // Quay về danh sách

        } catch (ex) {
            console.error("❌ Lỗi API:", ex.response?.data);
            Alert.alert("Lỗi", "Không thể lưu dữ liệu. Kiểm tra console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>
                {isEditMode ? "🛠 Chỉnh Sửa Tour" : "📝 Đăng Tour Mới"}
            </Text>

            <Text style={styles.label}>Tên Tour:</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Giá vé (VNĐ):</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

            <Text style={styles.label}>Địa điểm:</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} />

            <Text style={styles.label}>Ngày khởi hành:</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} />

            <Text style={styles.label}>Danh mục ID:</Text>
            <TextInput style={styles.input} value={categoryId} onChangeText={setCategoryId} keyboardType="numeric" />

            <Text style={styles.label}>Mô tả:</Text>
            <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                value={description} onChangeText={setDescription} multiline={true} 
            />

            <Text style={styles.label}>Hình ảnh:</Text>
            <TouchableOpacity style={styles.imgBtn} onPress={pickImage}>
                <Text style={{color: '#007AFF'}}>📸 {isEditMode ? "Thay đổi ảnh khác" : "Chọn ảnh bìa"}</Text>
            </TouchableOpacity>

            {/* Hiển thị ảnh: Ưu tiên ảnh mới chọn, nếu không có thì hiện ảnh cũ từ server */}
            {(image || (isEditMode && tour.image)) && (
                <Image 
                    source={{ uri: image ? image.uri : tour.image }} 
                    style={styles.previewImage} 
                />
            )}

            {loading ? <ActivityIndicator size="large" color="blue" style={{marginTop: 20}} /> : (
                <TouchableOpacity style={[styles.submitBtn, isEditMode && {backgroundColor: '#FF9800'}]} onPress={handleSubmit}>
                    <Text style={styles.btnText}>
                        {isEditMode ? "LƯU THAY ĐỔI" : "ĐĂNG BÀI"}
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

// ... Styles giữ nguyên như cũ ...
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', marginTop: 10 },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, backgroundColor: '#f9f9f9' },
    imgBtn: { padding: 15, borderWidth: 1, borderColor: '#007AFF', borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', marginVertical: 10 },
    previewImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 10, resizeMode: 'cover' },
    submitBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 50 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default TourForm;