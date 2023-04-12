import dynamic from 'next/dynamic'
import { Provider } from 'react-redux';

import { wrapper } from '../store/store';

const Navbar = dynamic(() => import('../components/Navbar/Navbar'), { ssr: false })
const Footer = dynamic(() => import('../components/Footer/Footer'), { ssr: false })
const Alert = dynamic(() => import('../components/Alert/Alert'), { ssr: false })

import '../styles/globals.css'
import { ProviderContext } from '../constants/context/Context'

function MyApp({ Component, ...rest }) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const { pageProps } = props;

  return (
    <>
      <Provider store={store}>
        <ProviderContext>
          <Navbar />
          <Component {...pageProps} />
          <Footer />
          <Alert />
        </ProviderContext>
      </Provider>
    </>
  )
}

export default MyApp
