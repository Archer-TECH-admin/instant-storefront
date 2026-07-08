import {APP_NAME, CATCH_ALL, ComponentRegistry} from "@enonic/nextjs-adapter";
import PropsView from "@enonic/nextjs-adapter/views/PropsView";
import {commonQuery, commonVariables} from "./queries/common";
import "@enonic/nextjs-adapter/baseMappings";
import ProductPage from "./enonic/pages/ProductPage";
import LandingPage from "./enonic/pages/LandingPage";
import ProductDetail from "./enonic/parts/ProductDetail";
import ProductShowcase from "./enonic/parts/ProductShowcase";
import HeroPart from "./enonic/parts/HeroPart";
import RichTextPart from "./enonic/parts/RichTextPart";
import CollectionsScrollerPart from "./enonic/parts/CollectionsScrollerPart";
import BlogGridPart from "./enonic/parts/BlogGridPart";
import EmptyPart from "./enonic/parts/EmptyPart";
import HeadingPart from "./enonic/parts/HeadingPart";
import ParagraphPart from "./enonic/parts/ParagraphPart";

ComponentRegistry.setCommonQuery([commonQuery, commonVariables]);

// Page mappings
ComponentRegistry.addPage(`${APP_NAME}:product`, { view: ProductPage });
ComponentRegistry.addPage(`${APP_NAME}:landing`, { view: LandingPage });

// Part mappings
ComponentRegistry.addPart(`${APP_NAME}:product-detail`, { view: ProductDetail });
ComponentRegistry.addPart(`${APP_NAME}:product-showcase`, { view: ProductShowcase });
ComponentRegistry.addPart(`${APP_NAME}:hero`, { view: HeroPart });
ComponentRegistry.addPart(`${APP_NAME}:rich-text`, { view: RichTextPart });
ComponentRegistry.addPart(`${APP_NAME}:collections-scroller`, { view: CollectionsScrollerPart });
ComponentRegistry.addPart(`${APP_NAME}:blog-grid`, { view: BlogGridPart });
ComponentRegistry.addPart(`${APP_NAME}:paragraph`, { view: ParagraphPart });
ComponentRegistry.addPart(`${APP_NAME}:child-list`, { view: EmptyPart });
ComponentRegistry.addPart(`${APP_NAME}:heading`, { view: HeadingPart });
ComponentRegistry.addPart(`${APP_NAME}:movie-details`, { view: EmptyPart });
ComponentRegistry.addPart(CATCH_ALL, { view: EmptyPart });

// Content type catch-all
ComponentRegistry.addContentType(CATCH_ALL, { view: PropsView });
