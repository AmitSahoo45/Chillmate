import React, { useState, useEffect, useContext } from 'react';
import { Howl } from 'howler';
import ReactSlider from 'react-slider';

import { ContextStore } from '../../constants/context/Context'
import styles from './AudioCard.module.css'

const FileRoots = {
    rain: '/assets/audio/rain.mp3',
    camp_fire: '/assets/audio/camp_fire.mp3',
    birds: '/assets/audio/birds.mp3',
    wind: '/assets/audio/wind.mp3',
    water_waves: '/assets/audio/water_waves.mp3',
    thunder: '/assets/audio/thunder.mp3',
    children_audience: '/assets/audio/children_audience.mp3',
    city_road: '/assets/audio/city_road.mp3',
}

const AudioCard = props => {
    const { Icon, audioName } = props || {}
    const { isAudioPlaying, isResetSettings } = useContext(ContextStore)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audio, setAudio] = useState(null)
    const [volume, setVolume] = useState(50)

    useEffect(() => {
        const music = new Audio(FileRoots[audioName])
        music.loop = true
        music.volume = volume / 100
        setAudio(music)
    }, [])

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
        if (isPlaying)
            setIsPlaying(false)
        else
            setIsPlaying(true)
    }

    const handleVolumeChange = value => {
        setVolume(value)
        audio.volume = value / 100
    }

    return (
        <div className="mx-4 my-4">
            <div className={`flex flex-col items-center justify-center relative rounded-[10px] shadow-custom overflow-hidden ${isPlaying ? styles.ButtonPlaying : styles.ButtonNotPlaying}`}>
                <div className='flex items-center justify-center w-[180px] h-40'>
                    <button onClick={toggleActive} className='absolute'>
                        <Icon className='text-4xl text-slate-700' />
                    </button>
                </div>
                {/* if isPlaying is true then apply styles.ButtonNotPlaying else apply styles.ButtonPlaying */}
                <div className={`${styles.reactSlider} ${isPlaying && styles.clicked}`}>
                    <ReactSlider
                        className='w-[160px] bg-black flex items-center justify-center'
                        thumbClassName="w-[15px] h-[15px] rounded-full bg-gray-300 text-transparent shadow-md"
                        trackClassName='h-[4px] bg-slate-400 rounded-[10px]'
                        onChange={handleVolumeChange}
                        value={volume}
                    />
                </div>
            </div>
        </div>
    )
}

export default AudioCard