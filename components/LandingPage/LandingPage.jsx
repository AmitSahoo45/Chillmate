import Image from 'next/legacy/image'
import React from 'react'
import { BsFillDropletFill, BsCloudRain } from "react-icons/bs";
import { GiCampfire, GiNestBirds, GiModernCity } from "react-icons/gi";
import { SiWindicss } from "react-icons/si";
import { BiWater } from "react-icons/bi";
import { IoThunderstormOutline } from "react-icons/io5";
import { MdOutlineChildFriendly } from "react-icons/md";

import AudioCard from '../AudioCard/AudioCard.component'
import { images } from '../../constants/Exports'
import Test from '../Test';

const LandingPage = () => {
    return (
        <main className='mb-6'>
            <section className='relative flex flex-col sm:flex-row mb-8'>
                <div className='flex-[1] flex items-center justify-center'>
                    <div className="relative w-[60%] h-[90%]">
                        <Image src={images.Developer_Activity}
                            alt="Developers working on computers"
                            layout="responsive"
                            objectFit="cover"
                            objectPosition="center"
                        />
                    </div>
                </div>
                <div className='flex-[1]'>
                    <header className=''>
                        <h1 className='flex flex-col font-semibold text-[3rem] '>
                            <span className='text-theme-orange text-center sm:text-left'>Code.</span>
                            <span className='text-theme-ferrari-red ml-3 text-center sm:text-left'>Relax.</span>
                            <span className='text-theme-forest-green ml-6 text-center sm:text-left'>Innovate.</span>
                        </h1>
                    </header>
                    <div className='w-4/5 mx-auto sm:mx-0'>
                        <p>Get away from the busy world and develop your own relaxing environment.</p>
                    </div>

                </div>
            </section>
            <div className='w-4/5 mx-auto my-3 flex items-center justify-center flex-col sm:flex-row'>
                <div className="flex-[1]">
                    <Image src={images.ToDo}
                        alt="Developers working on computers"
                        width={300}
                        height={300}
                    />
                </div>
            </div>
        </main>
    )
}

export default LandingPage