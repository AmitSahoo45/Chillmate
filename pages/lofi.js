import React, { useEffect, useState } from 'react'
import { BsPlay, BsPause, BsSkipBackward, BsSkipForward } from 'react-icons/bs'
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { app } from '../constants/Firebase/firebaseClient'
import { LofiM, Motivational, Chill, Study } from '../constants/Exports/FileNames'

const Lofi = () => {
    const [audio, setaudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState({
        isPlayingMtvl: false,
        isPlayingLofi: false,
        isPlayingChill: false,
        isPlayingStudy: false
    })

    const Storage = getStorage(app);

    const TogglePlay = (status) => {
        if (audio == null) {
            setIsPlaying({ ...isPlaying, [status]: true })
            const storageRef = ref(Storage, LofiM.audio);
            getDownloadURL(storageRef)
                .then((url) => {
                    const audio = new Audio(url);
                    audio.volume = 1;
                    audio.loop = true;
                    setaudio(audio);
                    audio.play();
                })
                .catch((error) => {
                    console.log(error)
                });
        } else {
            const isPlayingOther = Object.values(isPlaying).some((value) => value && value !== isPlaying[status]);
            const url = isPlayingOther ? null : audio.src;
            if (isPlaying[status]) {
                audio.pause();
                setIsPlaying({ ...isPlaying, [status]: false });
            } else {
                switch (true) {
                    case isPlayingOther:
                        audio.pause();
                        const otherStatus = Object.keys(isPlaying).find((key) => isPlaying[key] && key !== status);
                        setIsPlaying({ ...isPlaying, [otherStatus]: false, [status]: true });
                        const storageRef = ref(Storage, `${status}.audio`);
                        getDownloadURL(storageRef)
                            .then((url) => {
                                const audio = new Audio(url);
                                audio.volume = 1;
                                audio.loop = true;
                                setaudio(audio);
                                audio.play();
                            })
                            .catch((error) => {
                                console.log(error)
                            });
                        break;
                    default:
                        setIsPlaying({ ...isPlaying, [status]: true });
                        if (url) {
                            audio.play();
                        } else {
                            const storageRef = ref(Storage, `${status}.audio`);
                            getDownloadURL(storageRef)
                                .then((url) => {
                                    audio.src = url;
                                    audio.play();
                                })
                                .catch((error) => {
                                    console.log(error)
                                });
                        }
                }
            }
        }
    }


    useEffect(() => {
        console.log(isPlaying)
    }, [isPlaying]);


    return (
        <div className='container font-poppins mx-auto my-4'>
            <div className='flex flex-col items-center justify-center'>
                <div className='w-4/5 rounded-[12px] bg-slate-200 overflow-hidden shadow-md'>
                    {/* Header */}
                    <div className="h-16 w-full relative flex items-center justify-center uppercase">
                        <p className='text-[1rem] font-serif tracking-wider'>Motivation and Determination</p>
                    </div>
                    {/* Body */}
                    <div className='flex items-center justify-center w-full mx-auto py-3 bg-white'>
                        <div className='flex items-center justify-center'>
                            <BsSkipBackward className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all mr-3' alphabetic='Previos' />
                            {isPlaying.isPlayingMtvl ?
                                <BsPause className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all' onClick={() => TogglePlay('isPlayingMtvl')} alphabetic='Pause' /> :
                                <BsPlay className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all' onClick={() => TogglePlay('isPlayingMtvl')} alphabetic='Play' />
                            }
                            <BsSkipForward className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all  ml-3' alphabetic='Next' />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default Lofi