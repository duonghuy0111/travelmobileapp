import { createContext, useReducer } from 'react';

export const MyUserContext = createContext();

const userReducer = (currentState, action) => {
    switch (action.type) {
        case 'login':
            return action.payload;
        case 'logout':
            return null;
        default:
            return currentState;
    }
};

export default function MyUserProvider({ children }) {
    const [user, dispatch] = useReducer(userReducer, null);

    return (
        <MyUserContext.Provider value={[user, dispatch]}>
            {children}
        </MyUserContext.Provider>
    );
}