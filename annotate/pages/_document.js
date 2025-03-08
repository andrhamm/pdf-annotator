import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="PDF Annotation Tool for saving metadata about PDF pages" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
