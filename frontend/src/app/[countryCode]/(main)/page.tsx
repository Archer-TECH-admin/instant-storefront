import {FetchContentResult, validateData} from "@enonic/nextjs-adapter";
import {fetchContent} from "@enonic/nextjs-adapter/server";
import MainView from "@enonic/nextjs-adapter/views/MainView";
import "../../../components/_mappings";
import {Metadata} from "next";
import {draftMode} from "next/headers";
import React from "react";

export const revalidate = 3600;

export default async function Home({params}: { params: Promise<{ countryCode: string }> }) {
    const {isEnabled: draft} = await draftMode();
    const resolvedParams = await params;
    const data: FetchContentResult = await fetchContent({
        locale: resolvedParams.countryCode,
        contentPath: ["home"]
    });
    validateData(data);
    return (
        <MainView {...data}/>
    );
}

export async function generateMetadata({params}: { params: Promise<{ countryCode: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const {common} = await fetchContent({
        locale: resolvedParams.countryCode,
        contentPath: ["home"]
    });
    return {
        title: common?.get?.displayName || "Home",
    };
}
