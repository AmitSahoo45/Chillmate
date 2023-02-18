import React, { useEffect, useState } from 'react'
import { ref, getStorage, getDownloadURL } from 'firebase/storage'

import { app, storage } from '../constants/Firebase/firebaseClient'

const FileRoots = {
    rain: '/audio/rain.mp3',
    camp_fire: '/assets/audio/camp_fire.mp3',
    birds: '/assets/audio/birds.mp3',
    wind: '/assets/audio/wind.mp3',
    water_waves: '/assets/audio/water_waves.mp3',
    thunder: '/assets/audio/thunder.mp3',
    children_audience: '/assets/audio/children_audience.mp3',
    city_road: '/assets/audio/city_road.mp3',
}

const Test = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(50);
    const [audio, setAudio] = useState(null);

    useEffect(() => {
        const Storage = getStorage();
        const audioRef = ref(Storage, FileRoots['rain']);
        getDownloadURL(audioRef)
            .then((url) => {
                const audio = new Audio(url);
                audio.loop = true;
                audio.volume = volume / 100;
                setAudio(audio);
            })
            .catch((error) => {
                console.log(error);
            });
    }, [volume]);

    useEffect(() => {
        if (audio) {
            if (isPlaying) {
                audio.play();
            } else {
                audio.pause();
            }
        }
    }, [isPlaying, audio]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (event) => {
        setVolume(event.target.value);
    };

    return (
        <div>
            <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
            <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} />
        </div>
    );
};

export default Test