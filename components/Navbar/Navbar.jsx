import React, { useContext, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { app } from '../../constants/Firebase/firebaseClient'
import { Avatar } from '../../components'
import { ContextStore } from '../../constants/context/Context'
import { toast } from 'react-toastify'
import axios from 'axios'

const Navbar = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();

    const { user, setUser, setId } = useContext(ContextStore)

    const signInWithGoogle = () => {
        signInWithPopup(auth, provider)
            .then(async (result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                setUser({
                    isPresent: true,
                    name: result.user.displayName,
                    email: result.user.email,
                    photoURL: result.user.photoURL,
                    uid: result.user.uid
                })
                localStorage.setItem('CHILLMATE', JSON.stringify({
                    isPresent: true,
                    name: result.user.displayName,
                    email: result.user.email,
                    photoURL: result.user.photoURL,
                    uid: result.user.uid,
                    token: token
                }))

                const { data: { _id } } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/user/auth`, {
                    name: result.user.displayName,
                    email: result.user.email,
                    photoURL: result.user.photoURL,
                    googleID: result.user.uid
                })

                setId(_id)
                localStorage.setItem('CHILLMATE_id', _id)
            })
            .catch((error) => {
                toast.error(error.message)
            });
    }

    const signOut = () => {
        auth.signOut()
            .then(() => {
                setUser({
                    isPresent: false,
                    name: '',
                    email: '',
                    photoURL: '',
                    uid: ''
                })
                setId('')
                localStorage.removeItem('CHILLMATE')
                localStorage.removeItem('CHILLMATE_id')
            })
            .catch((error) => {
                toast.error(error.message)
            });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('CHILLMATE'))
        const id = localStorage.getItem('CHILLMATE_id')
        // console.log(user)
        if (user) setUser(user)
        if (id) setId(id)
    }, []);

    return (
        <nav className="bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm backdrop-saturate-200 border border-gray-300 border-opacity-50 rounded-lg py-2 px-4 flex justify-between items-center">
            <div className='relative '>
                <Link href="/" aria-label='Home'>
                    <Image src='/assets/images/logo.png' alt="logo" width={70} height={50} />
                </Link>
            </div>
            <div>
                {user.isPresent ? (
                    <div className='flex items-center'>
                        <button
                            className="bg-theme-orange text-white px-4 py-2 rounded-lg mr-4"
                            onClick={signOut}
                        >
                            Sign Out
                        </button>
                        <Avatar
                            src={user?.photoURL ? user.photoURL.replace('s96-c', 's500-c') : ''}
                            alt={user?.name}
                            size={50}
                        />
                    </div>
                ) : (
                    <button
                        className="custom-btn button"
                        onClick={signInWithGoogle}
                    ><span>Sign Up/Login</span></button>
                )}
            </div>
        </nav >

    )
}

export default Navbar