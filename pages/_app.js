import '../styles/globals.css'
import { Navbar, Footer } from '../components'
import { ProviderContext } from '../constants/context/Context'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <html lang="en" />
      </Head>
      <ProviderContext>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </ProviderContext>
    </>
  )
}

export default MyApp
