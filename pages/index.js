import Head from 'next/head'

import { LandingPage } from '../components'

export default function Home() {

  return (
    <div className=''>
      <Head>
        <title>ChillMate | Relax.Code.Innovate</title>
        <meta name="description" content="The ultimate productivity tool for programmers." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section>
        <LandingPage />
      </section>

    </div>
  )
}
