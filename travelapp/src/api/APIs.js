import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:8000/'; 

export const endpoints = {
    categories: '/categories/',
    services: '/services/',
    login: '/o/token/',
    current_user: '/users/current-user/',
    register: '/users/',
    bookings: '/bookings/', 
};

export const CLIENT_ID = 'sujnGcFe2mVDubIWoWnq0gvWg79RUdUBCQ1cxLXV'; 
export const CLIENT_SECRET = ''; 

export const authApi = (accessToken) => axios.create({
    baseURL: BASE_URL,
    headers: {
        "Authorization": `Bearer ${accessToken}`
    }
});

export default axios.create({
    baseURL: BASE_URL
});