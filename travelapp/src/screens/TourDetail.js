import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment'; // Cài đặt: npm install moment
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import API, { authApi, endpoints } from '../api/APIs';
import { MyUserContext } from '../context/MyUserContext';

const TourDetail = ({ route, navigation }) => {
    const { tourId } = route.params; 
    const [service, setService] = useState(null);
    const [comments, setComments] = useState([]); // 👇 State lưu danh sách bình luận
    const [content, setContent] = useState("");   // 👇 State lưu nội dung comment đang viết
    const [user] = useContext(MyUserContext); 

    // 1. Lấy chi tiết Tour và Danh sách bình luận
   useEffect(() => {
        const loadData = async () => {
            // 1. Tải chi tiết Tour (Quan trọng -> Cần báo lỗi nếu hỏng)
            try {
                const resService = await API.get(`${endpoints.services}${tourId}/`);
                setService(resService.data);
            } catch (ex) {
                console.error("Lỗi tải Tour:", ex);
                Alert.alert("Lỗi", "Không tải được thông tin tour.");
                return; // Nếu không lấy được Tour thì dừng luôn
            }

            // 2. Tải bình luận (Phụ -> Nếu lỗi thì kệ, chỉ log ra console thôi)
            try {
                const resComments = await API.get(`${endpoints.services}${tourId}/comments/`);
                setComments(resComments.data);
            } catch (ex) {
                console.log("Lỗi tải Comments (có thể do chưa có API):", ex);
                // Không Alert lỗi ở đây để tránh làm phiền user
            }
        }
        
        loadData();
    }, [tourId]);

    // 2. Hàm xử lý Đặt vé (Giữ nguyên logic Guest Mode của bạn)
    const booking = async () => {
        if (!user) {
            Alert.alert(
                "Yêu cầu đăng nhập",
                "Bạn cần đăng nhập để đặt vé. Chuyển đến trang đăng nhập ngay?",
                [
                    { text: "Hủy", style: "cancel" },
                    { 
                        text: "Đồng ý", 
                        onPress: () => {
                            navigation.navigate("Login", { 
                                previousScreen: "TourDetail", 
                                tourId: tourId 
                            });
                        } 
                    }
                ]
            );
            return;
        }

        try {
            const token = await AsyncStorage.getItem("access-token");
            await authApi(token).post(endpoints.bookings, {
                "service": tourId,
                "quantity": 1
            });
            Alert.alert("Thành công", "Đặt vé thành công! Xem lại trong mục Cá nhân.");
            navigation.goBack();
        } catch (ex) {
            console.error(ex);
            Alert.alert("Lỗi", "Đặt vé thất bại (Có thể đã hết chỗ).");
        }
    }

    // 3. Hàm gửi Bình luận mới (Mới thêm)
    const addComment = async () => {
        if (!user) {
            Alert.alert("Thông báo", "Vui lòng đăng nhập để bình luận");
            return;
        }
        if (!content.trim()) return; // Không cho gửi comment rỗng

        try {
            const token = await AsyncStorage.getItem("access-token");
            const res = await authApi(token).post(`${endpoints.services}${tourId}/comments/`, {
                content: content,
                rating: 5 // Mặc định 5 sao, bạn có thể làm thêm UI chọn sao
            });
            
            // Cập nhật list comment ngay lập tức (đưa comment mới lên đầu)
            setComments([res.data, ...comments]); 
            setContent(""); // Xóa ô nhập
        } catch (ex) {
            console.error(ex);
            Alert.alert("Lỗi", "Không gửi được bình luận.");
        }
    }

    if (!service) return <ActivityIndicator style={{marginTop: 50}} size="large" color="#007AFF" />;

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: service.image }} style={styles.image} />
            <View style={styles.content}>
                {/* --- Phần Thông tin Tour --- */}
                <Text style={styles.title}>{service.name}</Text>
                <Text style={styles.price}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                </Text>
                <Text style={styles.info}>📍 {service.location}</Text>
                <Text style={styles.info}>📅 Khởi hành: {service.start_date}</Text>
                <Text style={styles.desc}>{service.description}</Text>

                <TouchableOpacity style={styles.btn} onPress={booking}>
                    <Text style={styles.btnText}>ĐẶT NGAY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.navigate("Home")}>
                </TouchableOpacity>

                {/* --- Phần Bình luận & Đánh giá (Mới thêm) --- */}
                <View style={styles.commentSection}>
                    <Text style={styles.sectionTitle}>Đánh giá & Bình luận</Text>
                    
                    {/* Ô nhập bình luận */}
                    {user ? (
                        <View style={styles.inputContainer}>
                            <Image source={{ uri: user.avatar }} style={styles.avatarSmall} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Viết đánh giá của bạn..." 
                                value={content}
                                onChangeText={setContent}
                            />
                            <TouchableOpacity onPress={addComment}>
                                <Text style={styles.sendBtn}>Gửi</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.loginHint}>Đăng nhập để viết bình luận</Text>
                    )}

                    {/* Danh sách bình luận */}
                    {comments.map(c => (
                        <View key={c.id} style={styles.commentItem}>
                            <Image source={{uri: c.user.avatar}} style={styles.avatarSmall} />
                            <View style={styles.commentContent}>
                                <Text style={styles.commentUser}>{c.user.username}</Text>
                                <Text style={styles.commentText}>{c.content}</Text>
                                <Text style={styles.commentDate}>{moment(c.created_date).fromNow()}</Text>
                            </View>
                        </View>
                    ))}
                    {comments.length === 0 && <Text style={{color:'gray', marginTop:10}}>Chưa có đánh giá nào.</Text>}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    image: { width: '100%', height: 250 },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    price: { fontSize: 20, color: '#d9534f', fontWeight: 'bold', marginBottom: 10 },
    info: { fontSize: 15, marginBottom: 8, color: '#555' },
    desc: { lineHeight: 24, color: '#444', fontSize: 15, marginTop: 15 },
    btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 30 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Style cho phần Comment
    commentSection: { borderTopWidth: 5, borderTopColor: '#f5f5f5', paddingTop: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 10 },
    sendBtn: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
    loginHint: { color: 'gray', fontStyle: 'italic', marginBottom: 15 },
    
    commentItem: { flexDirection: 'row', marginBottom: 15 },
    avatarSmall: { width: 40, height: 40, borderRadius: 20 },
    commentContent: { marginLeft: 10, flex: 1, backgroundColor: '#f0f2f5', padding: 10, borderRadius: 12 },
    commentUser: { fontWeight: 'bold', marginBottom: 2 },
    commentText: { color: '#333', marginBottom: 5 },
    commentDate: { fontSize: 11, color: 'gray' }
});

export default TourDetail;