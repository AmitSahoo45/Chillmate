import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import Image from 'next/image';
const ReactSlider = lazy(() => import('react-slider'));
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { app } from '../../constants/Firebase/firebaseClient'
import Loader from '../Loader/Loader';
import { ContextStore } from '../../constants/context/Context'
import styles from '../../styles/AudioCard.module.css'

const FileRoots = {
    rain: '/audio/rain.mp3',
    camp_fire: '/audio/camp_fire.mp3',
    birds: '/audio/birds.mp3',
    wind: '/audio/wind.mp3',
    water_waves: '/audio/water_waves.mp3',
    thunder: '/audio/thunder.mp3',
    children_audience: '/audio/children_audience.mp3',
    city_road: '/audio/city_road.mp3',
}

const AudioCard = props => {
    const { Icon, audioName, Alt } = props || {}

    const { isAudioPlaying } = useContext(ContextStore)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audio, setAudio] = useState(null)
    const [volume, setVolume] = useState(50)
    const [loading, setLoading] = useState(false)

    const Storage = getStorage(app);

    useEffect(() => {
        if (audio) {
            if (!isAudioPlaying)
                audio.pause();
            else if (isAudioPlaying && isPlaying)
                audio.play();
        }
    }, [isAudioPlaying, isPlaying])

    useEffect(() => {
        if (audio) {
            if (isPlaying && isAudioPlaying)
                audio.play()
            else
                audio.pause()
        }
    }, [isPlaying])

    const toggleActive = () => {
        if (!audio) {
            setLoading(true)
            const storageRef = ref(Storage, FileRoots[audioName]);
            getDownloadURL(storageRef).then((url) => {
                const audio = new Audio(url);
                audio.volume = volume / 100;
                audio.loop = true;
                setAudio(audio);
                setIsPlaying(true);
                audio.play();
                setLoading(false)
            }).catch((error) => {
                console.log(error)
            });
        }
        else {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            }
            else {
                audio.play();
                setIsPlaying(true);
            }
        }
    }

    const handleVolumeChange = value => {
        setVolume(value)
        audio.volume = value / 100
    }

    return (
        <div className="mx-4 my-4">
            <Suspense fallback={<Loader />}>
                <div className={`flex flex-col items-center justify-center relative rounded-[10px] shadow-custom overflow-hidden ${isPlaying ? styles.ButtonPlaying : styles.ButtonNotPlaying}`}>
                    <div className='flex items-center justify-center w-[150px] h-32'>
                        <button onClick={toggleActive} className='absolute'>
                            {!loading ?
                                <Image width={40} height={40} src={Icon} alt={Alt} /> :
                                <Loader />
                            }
                        </button>
                    </div>
                    {/* if isPlaying is true then apply styles.ButtonNotPlaying else apply styles.ButtonPlaying */}
                    <div className={`${styles.reactSlider} ${isPlaying && styles.clicked}`}>
                        <ReactSlider
                            className='w-[130px] bg-black flex items-center justify-center'
                            thumbClassName="w-[15px] h-[15px] rounded-full bg-gray-300 text-transparent shadow-md"
                            trackClassName='h-[4px] bg-slate-400 rounded-[10px]'
                            onChange={handleVolumeChange}
                            value={volume}
                        />
                    </div>
                </div>
            </Suspense>
        </div>
    )
}

export default AudioCard