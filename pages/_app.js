import '../styles/globals.css'
import { Navbar, Footer, Alert } from '../components'
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
