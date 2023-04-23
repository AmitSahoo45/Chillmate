import React from 'react'
import { TbBrandTwitter, TbBrandLinkedin, TbBrandGithub, TbBrandChrome } from 'react-icons/tb';

const Footer = () => {
    return (
        <footer className="flex justify-center flex-col items-center w-full bg-theme-ecru-white mb-4">
            <p className='my-3'>Built with <span className="text-red-500">❤</span> by &nbsp;
                <a href="http://amit-kumar-sahoo.netlify.app/" target="_blank" rel="noreferrer" className="text-theme-ferrari-red hover:underline">
                    Amit Kumar Sahoo
                </a>
            </p>
            <div className="flex justify-center items-center space-x-4 text-gray-500">
                <a href="https://www.linkedin.com/in/amit-kumar-sahoo-web/" target="_blank" rel="noreferrer">
                    <TbBrandLinkedin className='text-2xl' />
                </a>
                <a href="http://github.com/AmitSahoo45" target="_blank" rel="noreferrer">
                    <TbBrandGithub className='text-2xl' />
                </a>
                <a href="http://amit-kumar-sahoo.netlify.app/" target="_blank" rel="noreferrer">
                    <TbBrandChrome className='text-2xl' />
                </a>
                <a href="https://twitter.com/DepressedCoder" target="_blank" rel="noreferrer">
                    <TbBrandTwitter className='text-2xl' />
                </a>
            </div>
        </footer>

    )
}

export default Footer