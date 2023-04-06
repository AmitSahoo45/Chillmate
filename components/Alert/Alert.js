import React from 'react'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Alert = () => {
    return (
        <div>
            <ToastContainer
                position="bottom-left"
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    )
}

export default Alert