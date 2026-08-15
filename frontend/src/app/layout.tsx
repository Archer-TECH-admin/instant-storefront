import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import Script from "next/script"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        <Script id="disable-hmr-websocket-in-preview" strategy="beforeInteractive">
          {`
            (function () {
              if (window.location.pathname.indexOf('/admin/com.enonic.app.contentstudio/') === -1) return;
              var OriginalWebSocket = window.WebSocket;
              window.WebSocket = function (url, protocols) {
                if (typeof url === 'string' && url.indexOf('webpack-hmr') !== -1) {
                  return {
                    close: function () {},
                    send: function () {},
                    addEventListener: function () {},
                    removeEventListener: function () {},
                    readyState: 3,
                  };
                }
                return protocols
                  ? new OriginalWebSocket(url, protocols)
                  : new OriginalWebSocket(url);
              };
              window.WebSocket.prototype = OriginalWebSocket.prototype;
            })();
          `}
        </Script>
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
