import { createContext, useState } from 'react';

const ContextStore = createContext();

const ProviderContext = ({ children }) => {
    const [isAudioPlaying, setisAudioPlaying] = useState(true);
    const [isResetSettings, setisResetSettings] = useState(false);
    const [user, setUser] = useState({
        isPresent: false,
        name: "",
        uid: "",
        photoURL: "",
        email: "",
        accessToken: ""
    });

    return (
        <ContextStore.Provider
            value={{
                isAudioPlaying, setisAudioPlaying,
                isResetSettings, setisResetSettings,
                user, setUser
            }}>
            {children}
        </ContextStore.Provider>
    )
}

export { ContextStore, ProviderContext };