import {RENDER_MODE, XP_REQUEST_TYPE} from "@enonic/nextjs-adapter";
import {LocaleContextProvider} from "@enonic/nextjs-adapter/client";
import {fetchContent} from "@enonic/nextjs-adapter/server";
import StaticContent from "@enonic/nextjs-adapter/views/StaticContent";
import {ReactNode} from "react";

type LayoutProps = {
    params: Promise<{ countryCode: string; contentPath: string[] }>
    children: ReactNode
}

export default async function ContentPathLayout({params, children}: LayoutProps) {
    const resolvedParams = await params;
    const {meta} = await fetchContent({
        locale: resolvedParams.countryCode,
        contentPath: ["home", ...(resolvedParams.contentPath || [])]
    });
    const isEdit = meta?.renderMode === RENDER_MODE.EDIT;

    if (meta.requestType === XP_REQUEST_TYPE.COMPONENT) {
        // Always wrap in <details> regardless of render mode — the proxy may not
        // forward the draft-mode cookie, causing renderMode to fall back to NEXT
        // even for genuine CS component requests. CS always needs this marker.
        return (
            <LocaleContextProvider locale={resolvedParams.countryCode}>
                <StaticContent condition={isEdit}>
                    <details data-single-component-output="true">{children}</details>
                </StaticContent>
            </LocaleContextProvider>
        );
    }
    return (
        <LocaleContextProvider locale={resolvedParams.countryCode}>
            <StaticContent condition={isEdit}>
                {children}
            </StaticContent>
        </LocaleContextProvider>
    )
}
