import React, { useEffect, useState } from 'react'
import { BsPlay, BsPause, BsSkipBackward, BsSkipForward } from 'react-icons/bs'
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { app } from '../constants/Firebase/firebaseClient'
import { Lofi, Motivational, Chill, Study } from '../constants/Exports/FileNames'

const lofi = () => {
    const [audio, setaudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState({
        isPlayingMtvl: false,
        isPlayingLofi: false,
        isPlayingChill: false,
        isPlayingStudy: false
    })

    const Storage = getStorage(app);

    const TooglePlay = (status) => {
        // if audio is null, theat means audio is being played played for the first time,
        // so as the user has requested, set the isPlaying of that category to true.
        // get the derails from the firebase storage and set the audio to the audio element.
        // play the audio 
        if (audio == null) {
            setIsPlaying({ ...isPlaying, [status]: true })
            const storageRef = ref(Storage, Lofi.audio);
            getDownloadURL(storageRef)
                .then((url) => {
                    const audio = new Audio(url);
                    audio.volume = 1;
                    audio.loop = true;
                    setaudio(audio);
                    audio.play()
                })
                .catch((error) => {
                    console.log(error)
                });
        } else {
            // The audio file is not null, whcih means that an audio file might already has been fetched from the firebase storage
            // and the audio might be playing. First check if one of the one in the isPlaying object is true, then check if the value of status is same as isPlaying[value]. Like if status is isPlayingMtvl and isPlaying.isPlayingMtvl is true, then pause the audio and set the isPlaying.isPlayingMtvl to false.
            // Else if the status is not same as isPlaying[value], the one which is playing, which means either one of isPlayingMtvl, isPlayingLofi, isPlayingChill, isPlayingStudy which is true, set it to false and pause the audio.
            // Now set isPlaying[status] to true, fetch the audio from the firestore storage and set the audio to the audio element and play the audio.
            if (isPlaying.isPlayingMtvl || isPlaying.isPlayingLofi || isPlaying.isPlayingChill || isPlaying.isPlayingStudy) {
                if (isPlaying[status]) {
                    audio.pause();
                    setIsPlaying({ ...isPlaying, [status]: false })
                } else {
                    if (isPlaying.isPlayingMtvl) {
                        audio.pause();
                        setIsPlaying({ ...isPlaying, isPlayingMtvl: false })
                    } else if (isPlaying.isPlayingLofi) {
                        audio.pause();
                        setIsPlaying({ ...isPlaying, isPlayingLofi: false })
                    } else if (isPlaying.isPlayingChill) {
                        audio.pause();
                        setIsPlaying({ ...isPlaying, isPlayingChill: false })
                    } else if (isPlaying.isPlayingStudy) {
                        audio.pause();
                        setIsPlaying({ ...isPlaying, isPlayingStudy: false })
                    }
                    setIsPlaying({ ...isPlaying, [status]: true })
                    const storageRef = ref(Storage, Lofi.audio);
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
                }
            } else {
                // If none of the isPlaying is true, then set the isPlaying[status] to true, fetch the audio from the firestore storage and set the audio to the audio element and play the audio.
                setIsPlaying({ ...isPlaying, [status]: true })
                const storageRef = ref(Storage, Lofi.audio);
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
                                <BsPause className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all' onClick={() => TooglePlay('isPlayingMtvl')} alphabetic='Pause' /> :
                                <BsPlay className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all' onClick={() => TooglePlay('isPlayingMtvl')} alphabetic='Play' />
                            }
                            <BsSkipForward className='text-3xl text-slate-500 hover:text-theme-orange hover:cursor-pointer transition-all  ml-3' alphabetic='Next' />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default lofi