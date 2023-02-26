import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

import { Avatar } from '../../components'
import { images } from '../../constants/Exports'

const Navbar = () => {
    const [user, setuser] = useState(true);
    return (
        <nav className="bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm backdrop-saturate-200 border border-gray-300 border-opacity-50 rounded-lg py-2 px-4 flex justify-between items-center">
            <div className='relative '>
                <Link href="/">
                    <Image src='/assets/images/Logo.png' alt="logo" width={70} height={50} />
                </Link>
            </div>
            <div>
                {user ? (
                    <Avatar
                        src="https://randomuser.me/api/portraits/women/44.jpg"
                        alt="User Avatar"
                        size={50}
                    />
                ) : (<button className="custom-btn button"><span>Sign Up/Login</span></button>)}
            </div>
        </nav >

    )
}

export default Navbar