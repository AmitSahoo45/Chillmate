import dynamic from 'next/dynamic'

const Navbar = dynamic(() => import('../components/Navbar/Navbar'), { ssr: false })
const Footer = dynamic(() => import('../components/Footer/Footer'), { ssr: false })
const Alert = dynamic(() => import('../components/Alert/Alert'), { ssr: false })

import '../styles/globals.css'
import { ProviderContext } from '../constants/context/Context'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <ProviderContext>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
        <Alert />
      </ProviderContext>
    </>
  )
}

export default MyApp
