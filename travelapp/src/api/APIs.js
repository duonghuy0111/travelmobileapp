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

export const CLIENT_ID = 'JNoevMkuRxFPDPxaknWv9BIZ7FiUyikZGnLty3nV'; 
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