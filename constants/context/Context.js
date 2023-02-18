import { createContext, useState } from 'react';

const ContextStore = createContext();

const ProviderContext = ({ children }) => {
    const [isAudioPlaying, setisAudioPlaying] = useState(true);
    const [isResetSettings, setisResetSettings] = useState(false);

    return (
        <ContextStore.Provider
            value={{
                isAudioPlaying, setisAudioPlaying,
                isResetSettings, setisResetSettings
            }}>
            {children}
        </ContextStore.Provider>
    )
}

export { ContextStore, ProviderContext };