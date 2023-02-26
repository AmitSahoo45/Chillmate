import Image from 'next/image'
import React from 'react'

import AudioCard from '../components/AudioCard/AudioCard'
import { images } from '../constants/Exports'

const chillSounds = () => {
    return (
        <div>
            <div className='w-4/5 mx-auto mb-3'>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard Icon={images.rain} audioName='rain' Alt='Rain' />
                    <AudioCard Icon={images.camp_fire} audioName='camp_fire' Alt='Camp Fire' />
                    <AudioCard Icon={images.birds} audioName='birds' Alt='Birds' />
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard Icon={images.city_road} audioName='city_road' Alt='City Road' />
                    <AudioCard Icon={images.children_audience} audioName='children_audience' Alt='Audience' />
                    <AudioCard Icon={images.thunder} audioName='thunder' Alt='Thunder' />
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard Icon={images.water_waves} audioName='water_waves' Alt='Water Waves' />
                    <AudioCard Icon={images.wind} audioName='wind' Alt='Wind' />
                </div>
            </div>
        </div>
    )
}

export default chillSounds