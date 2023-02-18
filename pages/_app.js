import '../styles/globals.css'
import { Navbar, Footer } from '../components'
import { ProviderContext } from '../constants/context/Context'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <ProviderContext>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </ProviderContext>
    </>
  )
}

export default MyApp
