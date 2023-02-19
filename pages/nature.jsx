import React from 'react'
import { BsCloudRain } from "react-icons/bs";
import { GiCampfire, GiNestBirds, GiModernCity } from "react-icons/gi";
import { SiWindicss } from "react-icons/si";
import { BiWater } from "react-icons/bi";
import { IoThunderstormOutline } from "react-icons/io5";
import { MdOutlineChildFriendly } from "react-icons/md";

import AudioCard from '../components/AudioCard/AudioCard.component';

const nature = () => {
    return (
        <div>
            <div></div>
            <div className='w-4/5 mx-auto mb-3'>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard
                        Icon={BsCloudRain}
                        audioName='rain'
                    />
                    <AudioCard
                        Icon={GiCampfire}
                        audioName='camp_fire'
                    />
                    <AudioCard
                        Icon={GiNestBirds}
                        audioName='birds'
                    />
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard
                        Icon={SiWindicss}
                        audioName='wind'
                    />
                    <AudioCard
                        Icon={BiWater}
                        audioName='water_waves'
                    />
                    <AudioCard
                        Icon={IoThunderstormOutline}
                        audioName='thunder'
                    />
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <AudioCard
                        Icon={MdOutlineChildFriendly}
                        audioName='children_audience'
                    />
                    <AudioCard
                        Icon={GiModernCity}
                        audioName='city_road'
                    />
                </div>
            </div>
        </div>
    )
}

export default nature