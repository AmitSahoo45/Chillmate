import React, { useState } from 'react'
import Head from 'next/head'
import { AiFillPauseCircle } from 'react-icons/ai'

import AudioCard from '../components/AudioCard/AudioCard'

const ChillSounds = () => {
    const [parentIsPlaying, setParentIsPlaying] = useState(false)
    return (
        <div className='relative'>
            <Head>
                <title>Listen to Chilling Music while you code!🎼</title>
                <meta name="description" content="Listen to Chilling Music while you code!🎼" />
            </Head>
            <div>
                <div className='text-center py-4'>
                    <p>Click on the box to play the audio</p>
                </div>
                <div className='w-4/5 mx-auto mb-3'>
                    <div className="flex flex-wrap items-center justify-center">
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/rain.png' audioName='rain' Alt='Rain' />
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/camp_fire.png' audioName='camp_fire' Alt='Camp Fire' />
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/birds.png' audioName='birds' Alt='Birds' />
                    </div>
                    <div className="flex flex-wrap items-center justify-center">
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/city_road.png' audioName='city_road' Alt='City Road' />
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/children_audience.png' audioName='children_audience' Alt='Audience' />
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/thunder.png' audioName='thunder' Alt='Thunder' />
                    </div>
                    <div className="flex flex-wrap items-center justify-center">
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/water_waves.png' audioName='water_waves' Alt='Water Waves' />
                        <AudioCard parentIsPlaying={parentIsPlaying} setParentIsPlaying={setParentIsPlaying} Icon='/assets/images/wind.png' audioName='wind' Alt='Wind' />
                    </div>
                </div>
            </div>
            <div className={`absolute bottom-10 left-1/2 right-1/2 bg-white shadow-lg w-36 ${parentIsPlaying ? 'block' : 'hidden'}`}>
                <div className='text-center py-4'>
                    <AiFillPauseCircle className='text-4xl text-red-500' />
                </div>
            </div>
        </div>
    )
}

export default ChillSounds