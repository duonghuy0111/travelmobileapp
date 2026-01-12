import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext, useEffect } from 'react';
import { View } from 'react-native'; // Thêm ActivityIndicator
import { authApi, endpoints } from './src/api/APIs';
import MyUserProvider, { MyUserContext } from './src/context/MyUserContext';

// Import các màn hình
import Home from './src/screens/Home';
import Login from './src/screens/Login';
import MyBookings from './src/screens/MyBookings';
import Profile from './src/screens/Profile';
import ProfileUpdate from './src/screens/ProfileUpdate';
import Register from './src/screens/Register';
import TourDetail from './src/screens/TourDetail';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. Định nghĩa các Stack con ---
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" component={Home} options={{ title: "Khám phá Du lịch" }} />
      <Stack.Screen name="TourDetail" component={TourDetail} options={{ title: "Chi tiết Tour" }} />
    </Stack.Navigator>
  );
}

const ProfileStack = () => {
    return (
        <Stack.Navigator>
             <Stack.Screen name="ProfileScreen" component={Profile} options={{ title: "Cá nhân", headerShown: false }} />
             <Stack.Screen name="MyBookings" component={MyBookings} options={{ title: "Lịch sử đặt vé" }} />
             <Stack.Screen name="ProfileUpdate" component={ProfileUpdate} options={{ title: "Cập nhật hồ sơ" }} />
        </Stack.Navigator>
    )
}

const MyTab = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Trang chủ", tabBarIcon: () => <View style={{width:20, height:20, backgroundColor:'blue'}}/> }} /> 
      {/* Bạn nhớ thêm Icon cho đẹp nhé */}
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Cá nhân", tabBarIcon: () => <View style={{width:20, height:20, backgroundColor:'green'}}/> }} />
    </Tab.Navigator>
  );
}

// --- 2. Component Điều hướng chính (Chứa logic Auto Login) ---
const AppContent = () => {
    const [user, dispatch] = useContext(MyUserContext);

    // Check login khi mở App
    useEffect(() => {
        const checkLogin = async () => {
            const token = await AsyncStorage.getItem("access-token");
            if (token) {
                try {
                    let userRes = await authApi(token).get(endpoints['current-user']);
                    dispatch({
                        type: "login",
                        payload: userRes.data
                    });
                } catch (e) {
                    console.log("Token hết hạn hoặc lỗi mạng");
                }
            }
        }
        checkLogin();
    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* Luôn hiển thị Home (MyTab) trước */}
                <Stack.Screen name="Home" component={MyTab} />
                
                {/* Các màn hình Auth nằm ngoài Tab */}
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Register" component={Register} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// --- 3. Root Export ---
export default function App() {
  return (
    <MyUserProvider>
      {/* Gọi AppContent ở đây để nó được nằm trong Context Provider */}
      <AppContent />
    </MyUserProvider>
  );
}