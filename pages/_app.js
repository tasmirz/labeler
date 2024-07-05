import globalStyles from './globalStyles.css'
import { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />
}