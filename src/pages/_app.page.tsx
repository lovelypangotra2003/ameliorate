import { UserProvider as AuthUserProvider } from "@auth0/nextjs-auth0/client";
import { Global } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { TourProvider } from "@reactour/tour";
import PlausibleProvider, { usePlausible } from "next-plausible";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

import { globals } from "@/pages/_app.styles";
import Layout from "@/web/common/components/Layout";
import { getThemeOptions } from "@/web/common/theme";
import { trpc } from "@/web/common/trpc";
import "@/web/common/globals.css";
import "@/web/common/patches/fixGoogleTranslateIssue";

// influence Google Search to display search results with the name "Ameliorate" instead of ameliorate.app https://developers.google.com/search/docs/appearance/site-names#how-site-names-in-google-search-are-created
const siteNameJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ameliorate",
  url: "https://ameliorate.app/",
};

// eslint-disable-next-line functional/no-let -- jank way to enable trpc queries outside of react tree, e.g. from zustand middleware https://github.com/trpc/trpc/discussions/2926#discussioncomment-5647033
export let trpcClient = null as unknown as ReturnType<typeof trpc.useContext>["client"];

// eslint-disable-next-line functional/no-let -- not sure why `plausible()` is only exposed through a hook, but this enables using it outside of a react tree, e.g. from zustand store
export let plausible = null as unknown as ReturnType<typeof usePlausible>;

const MyApp = ({ Component, pageProps }: AppProps) => {
  const theme = createTheme(getThemeOptions("light"));

  const utils = trpc.useContext();
  useEffect(() => {
    trpcClient = utils.client;
  }, [utils.client]);

  const plausibleHook = usePlausible();
  useEffect(() => {
    plausible = plausibleHook;
  }, [plausibleHook]);

  return (
    <>
      <Head>
        <title>Ameliorate</title>
        <meta
          name="description"
          content="Ameliorate is a tool for collaboratively refining your understanding of a situation, so that you can make better decisions about it."
        />

        {/* icons for various browsers - these links (and their images) were generated by uploading a png to https://realfavicongenerator.net/ */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Ameliorate" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* https://mui.com/material-ui/getting-started/usage/#responsive-meta-tag */}
        <meta name="viewport" content="initial-scale=1, width=device-width" />

        <meta property="og:type" content="website" />

        {/* influence Google Search to display search results with the name "Ameliorate" instead of ameliorate.app https://developers.google.com/search/docs/appearance/site-names#how-site-names-in-google-search-are-created */}
        <meta property="og:site_name" content="Ameliorate" />
        <script type="application/ld+json">{JSON.stringify(siteNameJsonLd)}</script>
      </Head>

      <PlausibleProvider domain="ameliorate.app">
        {/* https://mui.com/material-ui/integrations/interoperability/#setup */}
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />

            <TourProvider
              steps={[]}
              showBadge={false}
              styles={{ maskWrapper: () => ({ display: "none" }) }}
              className={
                "rounded-2xl border border-black !shadow-lg !shadow-black" +
                // 32rem is the most we really need, but only go up to 95vw so it doesn't go to the edge of the screen.
                // use w instead of max-w so that width is consistent
                " !max-w-none w-[min(95vw,32rem)]" +
                // for (probably extremely rare) 480px height phones
                // use max-h because children will take up consistent height
                " max-h-[95vh]" +
                // super jank & brittle way to hide nav when there's only one step, because there's no exposed way for reactour do this...
                // also add padding to nav buttons so they're easier to click
                " [&_>_div:nth-child(3):has(div_>_button:only-child)]:!hidden [&_>_div:nth-child(3)_button]:!p-1"
              }
            >
              <AuthUserProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </AuthUserProvider>
            </TourProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </PlausibleProvider>

      <Global styles={globals} />
    </>
  );
};

export default trpc.withTRPC(MyApp);
