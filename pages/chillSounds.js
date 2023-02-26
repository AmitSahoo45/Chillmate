import Image from 'next/image'
import React from 'react'

import AudioCard from '../components/AudioCard/AudioCard'

const chillSounds = () => {
    return (
        <div>
            <div className='w-4/5 mx-auto mb-3'>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard Icon='/assets/images/rain.png' audioName='rain' Alt='Rain' />
                    <AudioCard Icon='/assets/images/camp_fire.png' audioName='camp_fire' Alt='Camp Fire' />
                    <AudioCard Icon='/assets/images/birds.png' audioName='birds' Alt='Birds' />
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard Icon='/assets/images/city_road.png' audioName='city_road' Alt='City Road' />
                    <AudioCard Icon='/assets/images/children_audience.png' audioName='children_audience' Alt='Audience' />
                    <AudioCard Icon='/assets/images/thunder.png' audioName='thunder' Alt='Thunder' />
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard Icon='/assets/images/water_waves.png' audioName='water_waves' Alt='Water Waves' />
                    <AudioCard Icon='/assets/images/wind.png' audioName='wind' Alt='Wind' />
                </div>
            </div>
        </div>
    )
}

export default chillSounds