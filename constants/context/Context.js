import { createContext, useState } from 'react';
import { stages } from '../Exports/Pomodoro';

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
    const [formData, setFormData] = useState({
        pomodoroTime: stages.pomodoroTime / 60,
        shortBreakTime: stages.shortBreakTime / 60,
        longBreakTime: stages.longBreakTime / 60,
    })

    return (
        <ContextStore.Provider
            value={{
                isAudioPlaying, setisAudioPlaying,
                isResetSettings, setisResetSettings,
                user, setUser,
                formData, setFormData,
            }}>
            {children}
        </ContextStore.Provider>
    )
}

export { ContextStore, ProviderContext };